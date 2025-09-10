# Grumpy & Goofy Pottery — Shopify Theme

- Upload `shopify-theme.zip` in Shopify Admin → Online Store → Themes → Upload zip.
- Set homepage: add sections Hero and Featured products.
- Assign a collection in Featured products settings.
- Configure Header menu and upload a Logo.

Notes:
- CSS/JS from the original React build are in `assets/app.css` and `assets/app.js`.
- Images are copied into `assets/`.
- Product data and collections use Shopify Liquid objects; no client API calls needed.
- For quick add-to-cart, forms post to `/cart/add`.

Dev tasks left for integration:
- Replace any placeholder images with real assets via Admin.
- Ensure a collection is created and assigned on the homepage.
