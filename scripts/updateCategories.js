const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

async function updateListingCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
    console.log("Connected to MongoDB");

    // Find all listings without category
    const listings = await Listing.find({ category: { $exists: false } });
    console.log(`Found ${listings.length} listings without categories`);

    // Category mapping based on location/title keywords
    const categoryMapping = {
      beach: ['beach', 'coastal', 'shore', 'ocean', 'sea', 'malibu', 'cancun', 'bali', 'miami', 'phuket', 'mykonos'],
      mountains: ['mountain', 'aspen', 'banff', 'swiss', 'alps', 'verbier', 'montana', 'lake tahoe'],
      cabin: ['cabin', 'treehouse', 'cottage', 'cotswolds', 'charleston'],
      pool: ['pool', 'penthouse', 'luxury', 'villa'],
      camping: ['camping', 'retreat', 'getaway'],
      farm: ['farm', 'rural'],
      arctic: ['arctic', 'snow', 'ice'],
      trending: ['trending', 'popular'],
      luxury: ['luxury', 'penthouse', 'villa', 'resort']
    };

    for (const listing of listings) {
      console.log(`\nProcessing: ${listing.title}`);
      console.log(`Location: ${listing.location}, ${listing.country}`);
      
      // Determine category based on location/title
      let assignedCategory = 'trending'; // default
      
      const searchText = `${listing.title} ${listing.location} ${listing.country}`.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categoryMapping)) {
        for (const keyword of keywords) {
          if (searchText.includes(keyword)) {
            assignedCategory = category;
            break;
          }
        }
        if (assignedCategory !== 'trending') break;
      }
      
      listing.category = assignedCategory;
      await listing.save();
      console.log(`✓ Assigned category: ${assignedCategory}`);
    }

    console.log("\n=== Update complete ===");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateListingCategories();
