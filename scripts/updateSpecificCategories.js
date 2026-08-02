const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

async function updateSpecificCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
    console.log("Connected to MongoDB");

    // Update specific listings to arctic (snow places)
    const arcticUpdates = await Listing.updateMany(
      { 
        $or: [
          { title: /Ski-In|Ski-Out|Chalet/i },
          { location: /Verbier|Swiss|Alps/i }
        ]
      },
      { category: 'arctic' }
    );
    console.log(`✓ Updated ${arcticUpdates.modifiedCount} listings to arctic category`);

    // Update specific listings to luxury (costly places)
    const luxuryUpdates = await Listing.updateMany(
      { 
        $or: [
          { title: /Luxury|Penthouse|Villa|Resort/i },
          { location: /Maldives|Dubai|Tuscany/i }
        ]
      },
      { category: 'luxury' }
    );
    console.log(`✓ Updated ${luxuryUpdates.modifiedCount} listings to luxury category`);

    // Show updated listings
    const arcticListings = await Listing.find({ category: 'arctic' });
    console.log("\n=== Arctic Listings ===");
    arcticListings.forEach(l => console.log(`- ${l.title} (${l.location})`));

    const luxuryListings = await Listing.find({ category: 'luxury' });
    console.log("\n=== Luxury Listings ===");
    luxuryListings.forEach(l => console.log(`- ${l.title} (${l.location})`));

    console.log("\n=== Update complete ===");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateSpecificCategories();
