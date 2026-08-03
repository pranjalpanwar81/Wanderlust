// Usage: Set ATLASDB_URL in environment, then run:
// node scripts/remove-listing.js "Historic Villa in Tuscany"

const mongoose = require('mongoose');
const Listing = require('../models/listing');

const title = process.argv[2];
if (!title) {
  console.error('Usage: node scripts/remove-listing.js "Listing Title"');
  process.exit(1);
}

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/wanderlust';

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const res = await Listing.deleteMany({ title });
    console.log('Deleted count:', res.deletedCount);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error connecting or deleting:', err && err.stack ? err.stack : err);
    process.exit(1);
  });
