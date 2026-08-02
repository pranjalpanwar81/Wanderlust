const Listing = require("../models/listing");
const normalizeListing = require("../utils/normalizeListing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
  const filter = req.query.filter || 'all';
  const sortBy = req.query.sortBy || 'default';
  const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0;
  const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : Infinity;
  
  let query = {};
  
  // Apply category filter
  if (filter !== 'all') {
    query.category = filter;
  }
  
  // Apply price range filter
  query.price = { $gte: minPrice, $lte: maxPrice };
  
  let allListings = await Listing.find(query);
  
  // Apply sorting
  if (sortBy === 'price-low') {
    allListings.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    allListings.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    allListings.sort((a, b) => b._id - a._id);
  }
  
  res.render("listings/index.ejs", { allListings, currentFilter: filter, sortBy, minPrice, maxPrice });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({ path: "reviews", populate: { path: "author" } });
  console.log("=== SHOW LISTING ===");
  console.log("Listing ID:", id);
  console.log("Listing location:", listing.location);
  console.log("Listing country:", listing.country);
  console.log("Listing geometry:", listing.geometry);
  console.log("Listing coordinates:", listing.geometry ? listing.geometry.coordinates : "No geometry");
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("=== CREATE LISTING STARTED ===");
    console.log("Full req.body:", req.body);
    console.log("req.body.listing:", req.body.listing);
    console.log("Listing Schema paths:", Listing.schema.paths);
    console.log("req.file:", req.file);
    
    let listingData = req.body.listing;
    
    // If a file was uploaded, use its path as the image URL
    if (req.file) {
      if (req.file.path) {
        // Cloudinary upload
        listingData.image = {
          url: req.file.path
        };
      } else if (req.file.filename) {
        // Local storage upload
        listingData.image = {
          url: `/uploads/${req.file.filename}`
        };
      }
    }
    
    console.log("listingData after file check:", listingData);
    console.log("Location:", listingData.location);
    console.log("Country:", listingData.country);
    
    // Geocode the location to get coordinates
    let response = await geocodingClient
      .forwardGeocode({
        query: `${listingData.location}, ${listingData.country}`,
        limit: 1
      })
      .send();
    
    if (response.body.features && response.body.features.length > 0) {
      listingData.geometry = {
        type: 'Point',
        coordinates: response.body.features[0].geometry.coordinates
      };
      console.log("Geocoded coordinates:", listingData.geometry);
      console.log("Geocoded location name:", response.body.features[0].place_name);
    } else {
      console.log("Geocoding failed, no features found. Using default coordinates.");
      listingData.geometry = {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Default to Delhi coordinates
      };
    }
    
    const newListing = new Listing(normalizeListing(listingData));
    newListing.owner = req.user._id;
    newListing.author = req.user._id;
    await newListing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Error in createListing:", err);
    next(err);
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = req.body.listing;
  
  // If a file was uploaded, use its path as the image URL
  if (req.file) {
    if (req.file.path) {
      // Cloudinary upload
      listing.image = {
        url: req.file.path
      };
    } else if (req.file.filename) {
      // Local storage upload
      listing.image = {
        url: `/uploads/${req.file.filename}`
      };
    }
  }
  
  // Geocode the location to get coordinates if location or country changed
  if (listing.location || listing.country) {
    const existingListing = await Listing.findById(id);
    const locationToGeocode = listing.location || existingListing.location;
    const countryToGeocode = listing.country || existingListing.country;
    
    let response = await geocodingClient
      .forwardGeocode({
        query: `${locationToGeocode}, ${countryToGeocode}`,
        limit: 1
      })
      .send();
    
    if (response.body.features && response.body.features.length > 0) {
      listing.geometry = {
        type: 'Point',
        coordinates: response.body.features[0].geometry.coordinates
      };
    } else {
      console.log("Geocoding failed, no features found. Using default coordinates.");
      listing.geometry = {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Default to Delhi coordinates
      };
    }
  }
  
  const updatedListing = normalizeListing(listing);
  await Listing.findByIdAndUpdate(id, { ...updatedListing }, { new: true, runValidators: true });
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
};