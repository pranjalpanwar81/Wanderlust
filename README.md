# Wanderlust

Wanderlust is a lightweight travel-stay listings demo built with Node.js, Express, MongoDB and EJS. It demonstrates CRUD workflows for listings, nested reviews, simple session-based authentication, server-side validation, and a responsive UI with dark-mode.

## :ledger: Index

- [About](#beginner-about)
- [Usage](#zap-usage)
  - [Installation](#electric_plug-installation)
  - [Commands](#package-commands)
- [Development](#wrench-development)
  - [Pre-Requisites](#notebook-pre-requisites)
  - [Development Environment](#nut_and_bolt-development-environment)
  - [File Structure](#file_folder-file-structure)
  - [Build](#hammer-build)
  - [Deployment](#rocket-deployment)
- [Community](#cherry-blossom-community)
  - [Contribution](#fire-contribution)
  - [Branches](#cactus-branches)
  - [Guideline](#exclamation-guideline)
- [FAQ](#question-faq)
- [Resources](#page_facing_up-resources)
- [Gallery](#camera-gallery)
- [Credit/Acknowledgment](#star2-creditacknowledgment)
- [License](#lock-license)

## :beginner: About

Wanderlust is a demo web application for browsing and managing travel listings (stays). Users can create listings with images and location data, view listings, and add reviews with star ratings and comments. The goal is to showcase practical full-stack skills using Express + MongoDB with server-rendered views.

## :zap: Usage

Use Wanderlust locally for demos, testing, or as a starter project for enhancements (cloud uploads, payments, search).

### :electric_plug: Installation

1. Clone the repository

```bash
git clone https://github.com/pranjalpanwar81/Wanderlust.git
cd Wanderlust
```

2. Install dependencies

```bash
npm install
```

3. Start MongoDB (example):

```bash
# start MongoDB (change path as needed)
mongod --dbpath ~/mongodb-data
```

4. (Optional) Seed demo data

```bash
node init/index.js
```

5. Start the app

```bash
node app.js
```

Open `http://localhost:8080` in your browser.

### :package: Commands

- `npm start` — start the app
- `node init/index.js` — seed demo data
- `node scripts/capture-screenshots.js` — capture screenshots (optional, requires Puppeteer)

## :wrench: Development

This section helps contributors set up and understand the codebase.

### :notebook: Pre-Requisites

- Node.js (18+ recommended)
- MongoDB Community Server (or use a remote `DB_URL`)

### :nut_and_bolt: Development Environment

1. Clone and install (see Installation above).
2. Use `node app.js` or `npm start` to run locally.
3. For rapid iteration, run with `nodemon` (if installed) or your preferred dev tooling.

### :file_folder: File Structure

```
.
├── app.js                 # Express configuration and server
├── controllers/           # Request handlers
├── models/                # Mongoose models (listing, review, user)
├── routes/                # Route definitions
├── views/                 # EJS templates
├── public/                # Static assets (css, js, images)
├── init/                  # Seed data script
├── scripts/               # Utility scripts (screenshots)
└── README.md
```

| No | File/Folder | Purpose |
|----|-------------|---------|
| 1  | `app.js`    | App entry and middleware |
| 2  | `models/`   | Database schemas |
| 3  | `views/`    | Server-rendered templates |

### :hammer: Build

No build step is required for the server. If you add a front-end build tool later, include instructions here (e.g., Webpack, Vite).

### :rocket: Deployment

- Use environment variables for `DB_URL`, `MAP_TOKEN`, and `SESSION_SECRET`.
- For production, host behind a process manager (PM2) or a container runtime; use managed MongoDB for reliability.
 - Use environment variables for `ATLASDB_URL`, `MAP_TOKEN`, and `SECRET`.
 - For production, host behind a process manager (PM2) or a container runtime; use managed MongoDB for reliability.

### Deploying to Render (example)

1. Push your code to GitHub (this repo).
2. In Render, create a new **Web Service** and connect your GitHub repo/`main` branch.
  - Render should detect the included `render.yaml` and use `npm install` and `node app.js` by default.
3. Add the required Environment Variables in Render (Service → Environment → Environment Variables):
  - `ATLASDB_URL` — MongoDB Atlas connection string (example: `mongodb+srv://USER:PASSWORD@cluster0.xyz.mongodb.net/wanderlust?retryWrites=true&w=majority`).
  - `SECRET` — session cookie secret (long random string).
  - Optional: `MAP_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`.
4. Ensure your MongoDB Atlas Network Access allows connections from Render (for testing you can add `0.0.0.0/0`, then restrict later).
5. Trigger a Manual Deploy (or push a new commit) and watch the Render Logs → Live tail for startup messages.

Live site
- The project is deployed at: https://wanderlustt-o0y5.onrender.com

Note: Do not commit secrets or full connection strings to the repository. Store them securely in the Render environment settings.

## :cherry_blossom: Community

Open-source contributions are welcome. Please follow the contribution steps below.

### :fire: Contribution

1. Report bugs via Issues.
2. Request features via Issues.
3. Create a pull request from a feature branch (`feat/<name>`). Target `stage` (or `main` if no stage branch exists) and include a clear description.

### :cactus: Branches

- `stage` — development branch
- `main` — production branch

Feature branches should be prefixed with `feat-`.

### :exclamation: Guideline

- Keep PRs small and focused.
- Include UI screenshots for visual changes.
- Add tests for new behaviors when possible.

## :question: FAQ

Q: Is this production ready?

A: No — it's a demo. For production, add hardened auth, cloud storage for images, logging, monitoring, and CI.

## :page_facing_up: Resources

- Official Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- MongoDB: https://www.mongodb.com/

## :camera: Gallery

Place screenshots in `docs/screenshots/`.

## :star2: Credit/Acknowledgment

Built as a demo project — author: pranjalpanwar81

## :lock: License

ISC# Wanderlust

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
