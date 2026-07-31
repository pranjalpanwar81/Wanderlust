const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
require('dotenv').config();

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

async function updateListingCoordinates() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
    console.log("Connected to MongoDB");

    // Find all listings without geometry
    const listings = await Listing.find({ geometry: { $exists: false } });
    console.log(`Found ${listings.length} listings without coordinates`);

    for (const listing of listings) {
      console.log(`\nProcessing: ${listing.title}`);
      console.log(`Location: ${listing.location}, ${listing.country}`);

      try {
        // Geocode the location
        let response = await geocodingClient
          .forwardGeocode({
            query: `${listing.location}, ${listing.country}`,
            limit: 1
          })
          .send();

        if (response.body.features && response.body.features.length > 0) {
          listing.geometry = {
            type: 'Point',
            coordinates: response.body.features[0].geometry.coordinates
          };
          await listing.save();
          console.log(`✓ Updated coordinates for ${listing.title}`);
          console.log(`  Coordinates: ${listing.geometry.coordinates}`);
          console.log(`  Geocoded location: ${response.body.features[0].place_name}`);
        } else {
          console.log(`✗ Geocoding failed for ${listing.title}`);
        }
      } catch (error) {
        console.log(`✗ Error processing ${listing.title}:`, error.message);
      }
    }

    console.log("\n=== Update complete ===");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateListingCoordinates();
