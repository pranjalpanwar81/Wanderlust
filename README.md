# Wanderlust

> A full-stack travel-listing application built with Node.js, Express, MongoDB, and EJS.

Wanderlust is a CRUD web app for discovering and managing travel stays. Visitors can browse listings, inspect their details, create or edit a listing, and leave ratings and comments. It is a learning project focused on building an Express application with server-rendered views and MongoDB persistence.

## Highlights

- Browse a responsive catalogue of travel listings
- Create, view, update, and delete listings
- Add a location, country, price, description, and image URL to each listing
- Add and remove 1–5 star reviews
- Validate listing and review data with Joi
- Use reusable EJS layouts and templates
- Handle missing routes and invalid requests with custom error pages
- Seed MongoDB with sample travel listings

## Tech stack

| Area | Tools |
| --- | --- |
| Server | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Views | EJS, ejs-mate |
| Validation | Joi |
| Styling | Bootstrap, CSS |
| Development | Nodemon, concurrently |

## Getting started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) (includes npm)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)

MongoDB must be available locally at `mongodb://127.0.0.1:27017`.

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/wanderlust.git
cd wanderlust
npm install
```

### Run the app

1. Start MongoDB in one terminal:

   ```bash
   mongod
   ```

2. In another terminal, populate the database with the included sample listings:

   ```bash
   node init/index.js
   ```

3. Start Wanderlust:

   ```bash
   node app.js
   ```

4. Visit [http://localhost:8080/listings](http://localhost:8080/listings).

### Available scripts

```bash
# Starts MongoDB when possible, then starts the Wanderlust app
npm start

# Starts the Wanderlust app and the separate classroom practice server with Nodemon
npm run dev
```

`npm run dev` also starts the `classroom` practice project on port `3000`; the Wanderlust app remains on port `8080`.

## Routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/listings` | Show all listings |
| GET | `/listings/new` | Show the create-listing form |
| POST | `/listings` | Create a listing |
| GET | `/listings/:id` | Show one listing and its reviews |
| GET | `/listings/:id/edit` | Show the edit form |
| PUT | `/listings/:id` | Update a listing |
| DELETE | `/listings/:id` | Delete a listing and its reviews |
| POST | `/listings/:id/reviews` | Add a review |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete a review |

> HTML forms use `method-override` to send `PUT` and `DELETE` requests.

## Project structure

```text
.
├── app.js                 # Main Express application
├── models/
│   ├── listing.js          # Listing schema and review cleanup hook
│   └── review.js           # Review schema
├── routes/
│   ├── listing.js          # Listing CRUD routes
│   └── review.js           # Nested review routes
├── views/                  # EJS layouts, partials, and pages
├── public/                 # Static CSS and client-side JavaScript
├── init/                   # Sample data and database seed script
├── utils/                  # Async wrapper and custom error class
├── schema.js               # Joi validation schemas
└── classroom/              # Separate Express practice project
```

## Database

The application uses a local MongoDB database named `wanderlust`:

```text
mongodb://127.0.0.1:27017/wanderlust
```

Running `node init/index.js` clears existing listings and inserts the sample data. Use it only when you are happy to replace your current listing data.

## Future improvements

- User authentication and authorization
- Image uploads through a cloud storage provider
- Search, filters, and map-based discovery
- Listing ownership and user profiles
- Automated tests and deployment configuration

## License

This project is available under the ISC license.
