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

## :shield: Concurrency & Real-time Features

### The Concurrency Problem

In a multi-user environment, a critical issue can occur when two users attempt to book the same listing simultaneously. This is known as the "double-booking problem":

**Scenario:**
1. User A and User B both view the same listing page
2. Both users select the same dates (e.g., Jan 15-20, 2024)
3. User A clicks "Book Now" at 10:00:00.500
4. User B clicks "Book Now" at 10:00:00.600
5. Both requests reach the server nearly simultaneously
6. Without proper concurrency control, both bookings could be accepted, leading to double-booking

**Why This Happens:**
- Traditional database operations aren't atomic by default
- Between reading the listing data and writing the booking, another user can also read the same data
- Race conditions occur when multiple operations access the same data concurrently

### Our Solution: Optimistic Concurrency Control

We implemented a robust solution using **Optimistic Concurrency Control (OCC)** with version checking:

**Implementation Details:**

1. **Version Field (__v):** Each listing document has a version field that increments on every update
2. **Atomic Updates:** Booking operations use `findOneAndUpdate` with version checking
3. **Retry Logic:** If a version conflict occurs, the operation automatically retries with exponential backoff
4. **Overlap Detection:** Before booking, we check for date overlaps with existing confirmed bookings

**Code Flow:**
```javascript
// Get current listing with version
const listing = await Listing.findById(id).lean();

// Check for overlapping bookings
const hasOverlap = listing.bookings.some(booking => {
  // Date overlap logic
});

// Atomic update with version check
const updatedListing = await Listing.findOneAndUpdate(
  { _id: id, __v: listing.__v }, // Version check
  { $push: { bookings: newBooking }, $inc: { __v: 1 } },
  { new: true }
);

if (!updatedListing) {
  // Version mismatch - retry
  retryWithBackoff();
}
```

**Benefits:**
- ✅ Prevents double-booking completely
- ✅ Handles high-traffic scenarios gracefully
- ✅ No database locks required (better performance)
- ✅ Automatic retry on conflicts
- ✅ Clear error messages for users

### Real-time Inventory Sync with WebSockets

To ensure all users see up-to-date booking information, we implemented real-time updates using Socket.IO:

**Implementation:**

1. **WebSocket Server:** Socket.IO server integrated with Express
2. **Event Broadcasting:** When a booking is created/cancelled, emit events to all connected clients
3. **Client-side Updates:** Frontend listens for events and updates UI without page refresh

**Events:**
- `bookingCreated` - Broadcasted when a new booking is confirmed
- `bookingCancelled` - Broadcasted when a booking is cancelled

**Code Flow:**
```javascript
// Server-side (booking route)
const io = req.app.get('io');
io.emit('bookingCreated', {
  listingId: id,
  booking: newBooking,
  availableDates: getAvailableDates(updatedListing.bookings)
});

// Client-side (show.ejs)
socket.on('bookingCreated', (data) => {
  if (data.listingId === currentListingId) {
    updateBookingsDisplay(data.booking);
    showNotification('New booking created!');
  }
});
```

**Benefits:**
- ✅ Instant updates across all user sessions
- ✅ No page refresh required
- ✅ Better user experience
- ✅ Reduced server load (no polling needed)

### Testing the Concurrency Solution

To test the double-booking prevention:

1. Open two browser windows with the same listing
2. Log in as different users in each window
3. Select the same dates simultaneously
4. Click "Book Now" in both windows at the same time
5. Only one booking should succeed; the other should show an error

The system will automatically handle the conflict and ensure data integrity.

## 🎯 Slot Availability System

The booking system now includes a slot-based availability feature to manage capacity limits and prevent overbooking.

### How It Works

**Slot Management:**
- Each listing has `maxSlots` (default: 10) and `availableSlots` fields
- Available slots are calculated dynamically: `maxSlots - confirmedBookings.length`
- Slots decrement when bookings are confirmed
- Slots increment when bookings are cancelled
- No date overlap restrictions - users can book any dates within slot limits

**Real-time Updates:**
- Slot counts update instantly across all connected users via WebSockets
- When a user books in one tab, all other tabs show decreased slots immediately
- Visual indicators show availability status (green/yellow/red)
- Booking form automatically hides when slots reach 0

**Visual Indicators:**
- **Green (4+ slots):** Good availability
- **Yellow (1-3 slots):** Limited availability  
- **Red (0 slots):** Fully booked - form hides and shows "No Slots Available" message

**Concurrency Protection:**
- Atomic slot counting with version checking
- Prevents overbooking even with simultaneous requests
- Same optimistic concurrency control applies to slot management

### Testing Slot Availability

1. Open the same listing in multiple browser tabs
2. Book in one tab and watch slot count decrease instantly in other tabs
3. Continue booking until slots reach 0
4. Observe "No Slots Available" message appear
5. Cancel a booking and watch slots increase immediately
6. Verify booking form reappears when slots become available

### Performance & Scalability

**Current Capacity:** 50-100 concurrent users
- Single Node.js process with event loop efficiency
- MongoDB Atlas cloud database with connection pooling
- Optimistic concurrency control for non-blocking operations
- Socket.IO for efficient real-time updates

**Scaling Recommendations:**
- **Immediate:** Enable Node.js clustering, add Redis caching, optimize database queries
- **Medium:** Load balancer, multiple server instances, Redis session store
- **High:** Microservices architecture, message queues, auto-scaling with Kubernetes

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
