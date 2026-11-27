"""Make a Facebook / social share image for every article page and point the page's tags at it.

For each article-*.html it:
  1. builds a 1200x630 picture from the article title and its illustration
     (assets/stories/article-*.svg) and saves it as assets/share/<page>.png
  2. sets og:type to "article", og:image (+ width, height, alt), twitter:image
     and the structured-data "image" to that picture.

Run from the site folder:  python3 scripts/make_share_images.py [--chrome /path/to/chrome]
Needs: pip install playwright  (it uses an installed Chrome / Chromium).
Running it again is safe: it rebuilds the pictures and leaves the tags correct.
"""
import argparse, base64, html, pathlib, re, sys

SITE = "https://lifetrackmind.com/"
ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = pathlib.Path(__file__).resolve().parent / "fonts"


def font_face(weight):
    data = base64.b64encode((FONTS / f"manrope-latin-{weight}-normal.woff2").read_bytes()).decode()
    return f"@font-face{{font-family:M;font-weight:{weight};src:url(data:font/woff2;base64,{data}) format('woff2')}}"


def logo_svg(page_html):
    m = re.search(r'<svg aria-hidden="true" width="44" height="44".*?</svg>', page_html, re.S)
    return m.group(0).replace('width="44" height="44"', 'width="52" height="52"') if m else ""


def card_html(title, art_svg, logo):
    art = base64.b64encode(art_svg.encode()).decode()
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{font_face(500)}{font_face(800)}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:#FAF7EF;font-family:M,sans-serif;color:#12302E;overflow:hidden;position:relative}}
.bar{{position:absolute;left:0;top:0;width:1200px;height:14px;background:#0F4C4A}}
.text{{position:absolute;left:72px;top:84px;width:520px;height:470px;display:flex;flex-direction:column}}
.kick{{font-weight:800;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:#A9791B}}
h1{{font-weight:800;font-size:60px;line-height:1.08;letter-spacing:-.02em;margin-top:22px}}
.brand{{margin-top:auto;display:flex;align-items:center;gap:14px;font-weight:800;font-size:26px}}
.brand small{{display:block;font-weight:500;font-size:20px;color:#3E5C59;letter-spacing:0}}
.art{{position:absolute;right:48px;top:144px;width:540px;height:342px;border-radius:28px;background:#fff;
  box-shadow:0 10px 40px rgba(18,48,46,.10);display:flex;align-items:center;justify-content:center;overflow:hidden}}
.art img{{width:540px;height:auto}}
</style></head><body><div class="bar"></div>
<div class="text"><div class="kick">Article</div><h1 id="t">{html.escape(title)}</h1>
<div class="brand">{logo}<div>Life Track Mind<small>lifetrackmind.com</small></div></div></div>
<div class="art"><img src="data:image/svg+xml;base64,{art}"></div>
<script>const t=document.getElementById('t');let s=60;while(t.scrollHeight>330&&s>36){{s-=2;t.style.fontSize=s+'px'}}</script>
</body></html>"""


def set_meta(page, prop, content, after):
    """Set <meta property=prop>; insert it after the `after` tag if missing."""
    tag = f'<meta property="{prop}" content="{html.escape(content, quote=True)}">'
    pat = re.compile(rf'<meta property="{re.escape(prop)}" content="[^"]*">')
    if pat.search(page):
        return pat.sub(lambda _: tag, page, count=1)
    a = re.search(rf'<meta property="{re.escape(after)}" content="[^"]*">', page)
    return page[:a.end()] + "\n" + tag + page[a.end():]


def update_tags(page, img_url, alt):
    page = set_meta(page, "og:type", "article", "og:site_name")
    page = set_meta(page, "og:image", img_url, "og:url")
    page = set_meta(page, "og:image:width", "1200", "og:image")
    page = set_meta(page, "og:image:height", "630", "og:image:width")
    page = set_meta(page, "og:image:alt", alt, "og:image:height")
    tw = f'<meta name="twitter:image" content="{img_url}">'
    if '<meta name="twitter:image"' in page:
        page = re.sub(r'<meta name="twitter:image" content="[^"]*">', tw, page)
    else:
        page = page.replace('<meta name="twitter:card" content="summary_large_image">',
                            '<meta name="twitter:card" content="summary_large_image">\n' + tw, 1)
    # structured data: the Article's own image (not the publisher logo)
    page = re.sub(r'("@type": "Article".*?"image": )"[^"]*"', lambda m: m.group(1) + f'"{img_url}"', page, count=1, flags=re.S)
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chrome", help="path to Chrome/Chromium (default: Playwright's own)")
    args = ap.parse_args()
    from playwright.sync_api import sync_playwright

    out_dir = ROOT / "assets" / "share"
    out_dir.mkdir(parents=True, exist_ok=True)
    pages = sorted(ROOT.glob("article-*.html"))
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chrome) if args.chrome else p.chromium.launch()
        tab = browser.new_page(viewport={"width": 1200, "height": 630})
        for f in pages:
            src = f.read_text(encoding="utf-8")
            title = html.unescape(re.search(r'<h1 class="tool-title">(.*?)</h1>', src, re.S).group(1)).strip()
            art = re.search(r'src="(assets/stories/article-[^"]+\.svg)"', src)
            if not art:
                print("skip (no illustration):", f.name); continue
            tab.set_content(card_html(title, (ROOT / art.group(1)).read_text(encoding="utf-8"), logo_svg(src)))
            tab.wait_for_timeout(150)
            png = out_dir / (f.stem + ".png")
            tab.screenshot(path=str(png))
            f.write_text(update_tags(src, f"{SITE}assets/share/{png.name}", f"{title} | Life Track Mind"), encoding="utf-8")
            print("done:", f.name)
        browser.close()


if __name__ == "__main__":
    sys.exit(main())
