#!/usr/bin/env python3
"""Fetch product images and links from the Amazon Creators API.

Reads data/catalog.json, writes data/amazon.json. Run by .github/workflows/amazon.yml.
Uses only the Python standard library.

Credentials come from the environment and are never printed:
  AMAZON_CREDENTIAL_ID, AMAZON_CREDENTIAL_SECRET   (required)
  AMAZON_CREDENTIAL_VERSION   3.1 = North America (default), 3.2 = Europe, 3.3 = Far East
  AMAZON_PARTNER_TAG          Associates tracking ID
  AMAZON_MARKETPLACE          default www.amazon.com
"""
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

TOKEN_URLS = {
    '3.1': 'https://api.amazon.com/auth/o2/token',
    '3.2': 'https://api.amazon.co.uk/auth/o2/token',
    '3.3': 'https://api.amazon.co.jp/auth/o2/token',
}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, 'data', 'catalog.json')
OUTPUT = os.path.join(ROOT, 'data', 'amazon.json')

CLIENT_ID = os.environ.get('AMAZON_CREDENTIAL_ID', '').strip()
CLIENT_SECRET = os.environ.get('AMAZON_CREDENTIAL_SECRET', '').strip()
VERSION = os.environ.get('AMAZON_CREDENTIAL_VERSION', '3.1').strip().lstrip('vV') or '3.1'
PARTNER_TAG = os.environ.get('AMAZON_PARTNER_TAG', '').strip()
MARKETPLACE = os.environ.get('AMAZON_MARKETPLACE', 'www.amazon.com').strip()
TOKEN_URL = os.environ.get('AMAZON_TOKEN_URL') or TOKEN_URLS.get(VERSION)
API_BASE = (os.environ.get('AMAZON_API_BASE') or 'https://creatorsapi.amazon').rstrip('/')
PAUSE = float(os.environ.get('AMAZON_PAUSE_SECONDS', '1.2'))
RESOURCES = ['images.primary.large', 'images.primary.medium', 'itemInfo.title']


def fail(message):
    print('ERROR: ' + message)
    sys.exit(1)


def post(url, body, headers=None):
    """POST JSON. Returns (status, parsed JSON or {}, raw text)."""
    request = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), method='POST')
    request.add_header('Content-Type', 'application/json')
    for name, value in (headers or {}).items():
        request.add_header(name, value)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status, text = response.status, response.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as error:
        status, text = error.code, error.read().decode('utf-8', 'replace')
    except urllib.error.URLError as error:
        return 0, {}, str(error.reason)
    try:
        return status, json.loads(text), text
    except ValueError:
        return status, {}, text


def get_token():
    status, data, text = post(TOKEN_URL, {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'creatorsapi::default',
    })
    token = data.get('access_token')
    if status != 200 or not token:
        # The error body names the problem (for example invalid_client); it does not contain the secret.
        fail('Could not sign in to Amazon (HTTP %s): %s' % (status, text[:300]))
    return token


def call(token, path, body):
    """Call a catalog operation, retrying when throttled. Returns (status, data, text)."""
    headers = {'Authorization': 'Bearer ' + token, 'x-marketplace': MARKETPLACE}
    for attempt in range(4):
        status, data, text = post(API_BASE + path, body, headers)
        time.sleep(PAUSE)
        if status == 429 or status >= 500:
            time.sleep(PAUSE * (attempt + 2))
            continue
        return status, data, text
    return status, data, text


def normalise(text):
    return re.sub(r'[^a-z0-9]+', ' ', (text or '').lower()).strip()


def title_of(item):
    return ((item.get('itemInfo') or {}).get('title') or {}).get('displayValue') or ''


def pick_image(item):
    primary = (item.get('images') or {}).get('primary') or {}
    for size in ('large', 'medium'):
        image = primary.get(size) or {}
        url = image.get('url') or ''
        if url.startswith('https://'):
            return {'url': url, 'width': image.get('width'), 'height': image.get('height')}
    return None


def record(item):
    url = item.get('detailPageURL') or ''
    image = pick_image(item)
    if not item.get('asin') or not url.startswith('https://') or not image:
        return None
    return {'asin': item['asin'], 'title': title_of(item), 'url': url, 'image': image}


def refused(status, text):
    """Amazon turned the request down. Not being eligible yet is a wait, not a fault."""
    if 'AssociateNotEligible' in text:
        print('::notice title=Waiting for Amazon::Sign-in worked, but Amazon has not given this Associates account product data access yet. '
              'It needs 10 qualifying sales in the past 30 days and can take up to 48 hours after a credential is created. '
              'Nothing was changed; the site keeps showing its own drawings and covers.')
        sys.exit(0)
    fail('Amazon refused the request (HTTP %s): %s' % (status, text[:400]))


def looks_ineligible(status, text):
    return status in (401, 403) or 'NotEligible' in text or 'AccessDenied' in text


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        fail('AMAZON_CREDENTIAL_ID and AMAZON_CREDENTIAL_SECRET are not set. Add them under the repository\'s Settings > Secrets and variables > Actions.')
    if not PARTNER_TAG:
        fail('AMAZON_PARTNER_TAG is not set.')
    if not TOKEN_URL:
        fail('Unknown credential version %r. Expected 3.1, 3.2 or 3.3.' % VERSION)

    catalog = json.load(open(CATALOG, encoding='utf-8'))
    try:
        previous = json.load(open(OUTPUT, encoding='utf-8')).get('items', {})
    except (OSError, ValueError):
        previous = {}

    token = get_token()
    print('Signed in to Amazon.')
    found = {}
    skipped = []
    base = {'marketplace': MARKETPLACE, 'partnerTag': PARTNER_TAG, 'resources': RESOURCES}

    # 1. Items with a known ASIN (set in the catalog, or found on an earlier run) are looked up directly.
    pinned = {}
    for entry in catalog:
        asin = entry.get('asin') or (previous.get(entry['key']) or {}).get('asin')
        if asin:
            pinned.setdefault(asin, []).append(entry['key'])
    asins = sorted(pinned)
    first_call = True
    for start in range(0, len(asins), 10):
        batch = asins[start:start + 10]
        status, data, text = call(token, '/catalog/v1/getItems', dict(base, itemIds=batch, itemIdType='ASIN'))
        if first_call and status != 200 and looks_ineligible(status, text):
            refused(status, text)
        first_call = False
        if status != 200:
            print('getItems failed for %s (HTTP %s): %s' % (batch, status, text[:200]))
            continue
        for item in ((data.get('itemsResult') or {}).get('items') or []):
            entry = record(item)
            if entry:
                for item_key in pinned.get(item.get('asin'), []):
                    found[item_key] = entry

    # 2. Everything else is searched for.
    for entry in catalog:
        if entry['key'] in found:
            continue
        if entry['kind'] == 'book':
            body = dict(base, title=entry['title'], author=entry['author'], searchIndex='Books', itemCount=5)
        else:
            body = dict(base, keywords=entry['keywords'], itemCount=1)
        status, data, text = call(token, '/catalog/v1/searchItems', body)
        if first_call and status != 200 and looks_ineligible(status, text):
            refused(status, text)
        first_call = False
        if status != 200:
            skipped.append('%s (HTTP %s: %s)' % (entry['key'], status, text[:120]))
            continue
        items = (data.get('searchResult') or {}).get('items') or []
        chosen = None
        for item in items:
            if entry['kind'] == 'book':
                # Only accept a result whose title starts with the book's title, so a
                # summary, workbook or unrelated book is never shown in its place.
                if not normalise(title_of(item)).startswith(normalise(entry['title'])):
                    continue
            chosen = record(item)
            if chosen:
                break
        if chosen:
            found[entry['key']] = chosen
        else:
            skipped.append('%s (no matching result with an image)' % entry['key'])

    print('Found %d of %d items.' % (len(found), len(catalog)))
    for line in skipped:
        print('  skipped: ' + line)
    if not found:
        fail('No items were returned, so data/amazon.json was left unchanged.')

    output = {
        'updated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'items': {k: found[k] for k in sorted(found)},
    }
    with open(OUTPUT, 'w', encoding='utf-8') as handle:
        json.dump(output, handle, indent=1, ensure_ascii=False)
        handle.write('\n')
    print('Wrote data/amazon.json')


if __name__ == '__main__':
    main()
