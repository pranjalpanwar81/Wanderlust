const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");

// Create a new booking with concurrent booking guard
router.post("/:id/book", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, startTime, endDate, endTime } = req.body;
  const userId = req.user._id;

  // Validate dates and times
  if (!startDate || !startTime || !endDate || !endTime) {
    throw new ExpressError("Start date, start time, end date and end time are required", 400);
  }

  // Combine date and time
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  if (start >= end) {
    throw new ExpressError("End date/time must be after start date/time", 400);
  }

  // Optimistic concurrency control - retry logic
  const maxRetries = 3;
  let bookingSuccess = false;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries && !bookingSuccess; attempt++) {
    try {
      // Get current listing with version
      const listing = await Listing.findById(id).lean();
      
      if (!listing) {
        throw new ExpressError("Listing not found", 404);
      }

      // Check for overlapping bookings
      const hasOverlap = listing.bookings && listing.bookings.some(booking => {
        if (booking.status === 'cancelled') return false;
        
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        return (start < bookingEnd && end > bookingStart);
      });

      if (hasOverlap) {
        throw new ExpressError("This listing is already booked for the selected dates", 409);
      }

      // Attempt to update with version check
      const updatedListing = await Listing.findOneAndUpdate(
        { 
          _id: id, 
          __v: listing.__v // Version check for optimistic concurrency
        },
        {
          $push: {
            bookings: {
              user: userId,
              startDate: start,
              endDate: end,
              status: 'confirmed',
              bookedAt: new Date()
            }
          },
          $inc: { __v: 1 } // Increment version
        },
        { new: true }
      );

      if (!updatedListing) {
        // Version mismatch - another user modified the listing
        console.log(`Concurrency conflict on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))); // Exponential backoff
        continue;
      }

      bookingSuccess = true;

      // Emit real-time update to all connected clients
      const io = req.app.get('io');
      if (io) {
        io.emit('bookingCreated', {
          listingId: id,
          booking: {
            user: userId,
            startDate: start,
            endDate: end,
            status: 'confirmed'
          },
          availableDates: getAvailableDates(updatedListing.bookings)
        });
      }

      req.flash("success", "Booking confirmed successfully!");
      res.redirect(`/listings/${id}`);

    } catch (error) {
      lastError = error;
      if (error.message.includes('already booked')) {
        throw error; // Don't retry for actual booking conflicts
      }
      // Continue retrying for other errors
    }
  }

  if (!bookingSuccess) {
    throw lastError || new ExpressError("Failed to create booking due to high traffic. Please try again.", 503);
  }
}));

// Helper function to get available dates
function getAvailableDates(bookings) {
  if (!bookings || bookings.length === 0) return [];
  
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  return confirmedBookings.map(b => ({
    startDate: b.startDate,
    endDate: b.endDate
  }));
}

// Cancel a booking
router.delete("/:id/booking/:bookingId", isLoggedIn, wrapAsync(async (req, res) => {
  const { id, bookingId } = req.params;
  const userId = req.user._id;

  const listing = await Listing.findById(id);
  
  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  const booking = listing.bookings.id(bookingId);
  
  if (!booking) {
    throw new ExpressError("Booking not found", 404);
  }

  // Check if user owns the booking
  if (booking.user.toString() !== userId.toString()) {
    throw new ExpressError("You can only cancel your own bookings", 403);
  }

  booking.status = 'cancelled';
  await listing.save();

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('bookingCancelled', {
      listingId: id,
      bookingId: bookingId,
      availableDates: getAvailableDates(listing.bookings)
    });
  }

  req.flash("success", "Booking cancelled successfully!");
  res.redirect(`/listings/${id}`);
}));

module.exports = router;
