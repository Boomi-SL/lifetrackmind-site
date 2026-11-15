# Life Track Mind website

Static website for Life Track Mind (lifetrackmind on TikTok, YouTube, Instagram and Facebook).
Live at https://boomi-sl.github.io/lifetrackmind-site/

## Pages
- `index.html`: homepage with the overthinker quiz and the stress check-in
- `breathe.html`: breathing timer
- `brain-dump.html`: brain dump tool
- `books.html`: bookshelf (Amazon links)
- `shop.html`: calm shop (Amazon links)
- `privacy.html`, `terms.html`, `disclosure.html`, `contact.html`: site information
- `404.html`: shown for missing pages

## Other files
- `css/site.css`: all shared styles and animations
- `js/`: one script per tool
- `assets/`: logo and the image shown when the site is shared
- `robots.txt`, `sitemap.xml`: for search engines

## Amazon images
- `data/catalog.json`: the books and shop items to look up.
- `scripts/fetch_amazon.py`: asks the Amazon Creators API for each item's image and product link and writes `data/amazon.json`.
- `.github/workflows/amazon.yml`: runs that script twice a day, using the repository secrets `AMAZON_CREDENTIAL_ID` and `AMAZON_CREDENTIAL_SECRET`. It can also be started by hand from the Actions tab.
- `js/amazon.js`: shows the images on the Bookshelf and Calm shop pages. If `data/amazon.json` is missing or older than 24 hours, the pages fall back to plain covers and Amazon search links.

No build step. Any static host can serve this folder as it is.

When `css/site.css` or a file in `js/` changes, raise the `?v=` number on the links to it in every page, so browsers load the new file.

If the site moves to its own domain, update the address in `404.html`, `robots.txt`, `sitemap.xml` and the `og:url` / `og:image` tags.
