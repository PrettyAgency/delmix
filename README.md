# Delmix Engineering website

Static HTML, CSS and JavaScript build of delmix.com.au, configured for IIS. There is no framework and no build step: what is in `site/` is exactly what gets served.

## Repository layout

```
site/                                   <- IIS web root (point the site's physical path here)
  index.html                            Home
  about-us/index.html                   About
  contact-us/index.html                 Contact + enquiry form
  products-and-services/index.html      Products & services overview
  products-and-services/<slug>/         7 product pages + creteaway-plus
  lp/creteaway-plus/index.html          CreteAway+ advertising landing page (noindex)
  404.html                              Not-found page
  assets/css/site.css                   All styles
  assets/js/site.js                     All behaviour, no dependencies
  assets/img/                           WebP images (480 to 2000 px widths), logos, icons, share images
  assets/video/                         Background loops (720p WebM + MP4, 360p MP4)
  assets/fonts/                         Self-hosted woff2 fonts
  web.config                            IIS configuration
  sitemap.xml, robots.txt, favicon.ico
README.md, .gitignore, .gitattributes   Repository files (not served)
```

Page URLs match the previous site, so existing links and rankings carry over.

## Deploying to IIS

1. Clone or pull the repository on the server.
2. Create a site in IIS Manager (or repoint the existing one) with its physical path set to the `site` folder. No application pool settings matter because nothing here runs server-side code: "No Managed Code" is fine.
3. Install the IIS URL Rewrite module if it is not already there. Without it, remove the `<rewrite>` block from `site/web.config` or IIS will return a 500.19 error.
4. Browse the site and check that a video URL such as `/assets/video/hero-720.mp4` returns `206 Partial Content` for a range request. Safari needs this to play MP4.

`web.config` sets the default document, MIME types (`.webp`, `.webm`, `.mp4`, `.woff2`, `.svg`), static compression, security headers, the custom 404 page, 301 redirects for two broken legacy URLs, and caching (30 days under `/assets`, none for HTML pages). An HTTPS redirect rule is included but commented out. Read the note beside it before enabling it behind Cloudflare.

When you change `site.css` or `site.js`, visitors may hold the old copy for up to 30 days. Add a version to the reference in the pages (for example `site.css?v=2`) when you ship a change that must show immediately.

## Before going live

- **Enquiry forms.** The three forms (Contact, CreteAway+ product page, CreteAway+ landing page) have `data-endpoint=""`. Left empty, a valid enquiry opens a pre-filled email to info@delmix.com.au. To receive submissions directly, set `data-endpoint` to a handler URL that accepts a multipart POST and returns 2xx. The fields are `name`, `company`, `email`, `phone`, `topic`, `message` and `fleet`, plus `website`, a honeypot that must be empty. Campaign parameters and the page path are added automatically.
- **Address.** The site uses 40 Magazine Road, Dry Creek SA 5094. The previous site's footer and map said 49 Lavinia St, Athol Park. Confirm with the client. It appears in the footer of every page, on the Contact page and in the JSON-LD on the home page.
- **Google Tag Manager.** Container GTM-TG7H7WQ is on every page. No GA4, Google Ads or Meta conversion tags are configured in this code. The site pushes these dataLayer events for triggers: `generate_lead` (with `form_id` and `enquiry_topic`), `cta_click`, `click_phone`, `click_email`, `video_start`, `video_complete`.
- **Privacy policy.** The forms collect personal information. Link the client's privacy policy from the footer and form notes once supplied.
- **CreteAway+ video.** None was supplied, so no video section is shown. The styles and script for a click-to-play video block (`.vid`) are already in `site.css` and `site.js`.
- **CreteAway+ product image.** The label in the photo reads "By Best-Chem". Confirm the client has permission to use it.
- **Domain.** Canonical, Open Graph, schema and sitemap URLs use `https://delmix.com.au`.

## Editing

- The header, mobile menu and footer are repeated in every page. A change to navigation has to be made in all 14 HTML files (a find-and-replace across `site/` works).
- Image tags use `srcset` with several widths. To replace a photo, export the same widths with the same file names, or update the `srcset` list.
- Scroll reveals only animate text. Photos are never hidden, and everything is visible with JavaScript off or reduced motion on.
- Background videos only load when on screen. Phones get the 360p file, and visitors with reduced motion or data saver see the poster image only.
