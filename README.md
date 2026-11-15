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

No build step. Any static host can serve this folder as it is.

When `css/site.css` or a file in `js/` changes, raise the `?v=` number on the links to it in every page, so browsers load the new file.

If the site moves to its own domain, update the address in `404.html`, `robots.txt`, `sitemap.xml` and the `og:url` / `og:image` tags.
