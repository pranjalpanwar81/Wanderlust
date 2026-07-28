---
name: testing-wanderlust
description: How to run and test the Wanderlust Express/EJS/MongoDB app locally (DB setup, seeding, login, reaching the review create/edit flows).
---

# Testing Wanderlust locally

## Bring the app up
1. `npm install` in the repo root (node_modules is typically absent).
2. MongoDB is usually NOT installed. `start.sh` expects a `mongod` binary. If missing, download a standalone tarball
   (e.g. `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.14.tgz`), extract, then:
   `mongod --dbpath ~/mongodb-data --logpath ~/mongodb.log --fork`
3. Seed: `node init/index.js` (prints seeded owner usernames/passwords; usernames contain spaces, e.g. "Aarav Sharma"/aarav123).
4. Start: `node app.js` → http://localhost:8080 (DB `mongodb://127.0.0.1:27017/wanderlust`).

## Auth
- `/signup` creates a user but does NOT establish a session (nav still shows Login). Sign up, then log in at `/login`.

## Review flows
- Create review: listing show page (`/listings/:id`), star fieldset + comment, POST `/listings/:id/reviews`.
- Review **Edit/Delete buttons render only to the review AUTHOR** (`views/listings/show.ejs`), and `isReviewOwner`
  in `middleware.js` checks `review.author`. So to test the edit flow, just post your own review and edit that.
  Visiting another user's review edit URL should redirect to the listing with flash "You do not have permission to do that."
  (Historically this was gated on LISTING ownership — if you see Edit on other people's reviews, that regression is back.)
- Listing create/update run `utils/normalizeListing.js`, which drops an empty `image.url` so the schema default image
  applies. If `/listings/new` ever errors with `normalizeListing is not defined`, the require in `controllers/listings.js`
  is missing. Always test creation both WITH and WITHOUT an image URL.
- Useful check via the browser console on a listing show page:
  `document.querySelectorAll('.review-card').length` vs `document.querySelectorAll('.review-actions').length`
  (actions count should equal the number of reviews you authored).
- If you need a listing owned by your test user and UI creation is broken, reassign ownership with a mongoose one-liner:
  `node -e '...Listing.updateOne({_id:"<id>"},{owner:<userId>})'`.
- Restarting `node app.js` drops express sessions (MemoryStore) — expect to log in again after each restart.
- Validation: Joi `reviewSchema` requires `review.rating` 1-5; submitting with the default 0-star radio yields a
  400 error page `"review.rating" must be greater than or equal to 1` (expected graceful failure).

## Devin Secrets Needed
None — fully local.
