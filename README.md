# Wanderlust

Simple travel-stay listings demo built with Node.js, Express, MongoDB and EJS.

This repository contains a small server-rendered application to create, browse and review listings. It is intended for local demos and learning.

## Quick start

1. Clone and install:

```bash
git clone https://github.com/pranjalpanwar81/Wanderlust.git
cd Wanderlust
npm install
```

2. (Optional) Start MongoDB and seed demo data:

```bash
mongod --dbpath ~/mongodb-data
node init/index.js
```

3. Start the app:

```bash
node app.js
```

Open `http://localhost:8080` in your browser.

## Useful commands

- `npm start` — start the app
- `node init/index.js` — seed demo data
- `node scripts/capture-screenshots.js` — optional (requires Puppeteer)

## Where to look

- `app.js` — application entry
- `models/` — Mongoose schemas (listing, review, user)
- `routes/` and `controllers/` — request handlers
- `views/` — EJS templates
- `public/css/style.css` — main stylesheet (includes dark mode)

## License

ISC

---

If you want a longer README (diagrams, examples, screenshots), I can expand it later.
