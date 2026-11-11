# MDH Spice Catalogue

A one-page ordering site. The client picks boxes, places the order, and it lands in your Google Sheet (and your inbox, if you want).

```
index.html            the whole site
images/web/           product photos the site uses (small, ~25 KB each)
images/*.png|jpg      your original photos (not used by the site)
order-sheet/Code.gs   the script that saves orders to Google Sheets
.nojekyll             tells GitHub Pages to serve files as they are
```

## 1. Put it on GitHub Pages

1. Create a new repository on GitHub, e.g. `mdh-catalogue`. Private repos need a paid plan for Pages; public is fine (the page has `noindex`, so search engines won't list it).
2. From this folder:
   ```
   git init
   git add .
   git commit -m "MDH catalogue"
   git branch -M main
   git remote add origin https://github.com/<your-username>/mdh-catalogue.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After a minute the site is live at `https://<your-username>.github.io/mdh-catalogue/`. That's the link to send.

## 2. Receiving orders (Google Sheet)

A static site can't write to your repo without exposing a GitHub token to anyone who opens the page, so orders go to a Google Sheet instead. You can download it as CSV any time (**File → Download → CSV**).

1. Create a new Google Sheet, name it e.g. "MDH orders".
2. In the sheet: **Extensions → Apps Script**. Delete what's there and paste everything from `order-sheet/Code.gs`.
3. Optional: put your email in `NOTIFY_EMAIL` at the top to get an email for each order.
4. Click **Deploy → New deployment → Select type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, allow the permissions Google asks for, and copy the **Web app URL** (ends in `/exec`).
5. Open the URL in your browser. You should see `"Order receiver is running."`
6. In `index.html`, near the top of the script, paste it into `orderEndpoint`:
   ```js
   orderEndpoint: "https://script.google.com/macros/s/XXXX/exec",
   ```
7. Commit and push. Place a test order on the live site and check the **Orders** tab, then delete the test rows.

Each order is saved as one row per item, with the order number, customer details and totals repeated on every row so the CSV filters and pivots cleanly.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** so the same URL keeps working.

## Other settings in `index.html`

```js
sellerName: "",   // shown in the red band and on the order summary
whatsapp: "",     // digits only, e.g. "919876543210"; shown as a backup if no orderEndpoint is set
```

The header image is `images/web/hero.jpg`.

To change prices or products, edit the `RAW` list in `index.html`. Each line is `["Product name", "100gm", price]`. To add a photo, save a square JPG in `images/web/` named after the product in lowercase with hyphens (`sambhar-masala.jpg`) and add that name to the `IMAGES` list.

Note: the prices in the sheet come from the page, so the sheet trusts the page. That's fine for a link you send to one client; check totals before invoicing.
