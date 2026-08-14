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

      // Check if slots are available (count only confirmed bookings)
      const confirmedBookings = listing.bookings ? listing.bookings.filter(b => b.status === 'confirmed') : [];
      const actualAvailableSlots = (listing.maxSlots || 10) - confirmedBookings.length;
      
      if (actualAvailableSlots <= 0) {
        throw new ExpressError("No slots available for this listing", 409);
      }

      // Attempt to update with version check (slot-based system, no date overlap check)
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
          $inc: { __v: 1 } // Increment version only
        },
        { new: true }
      );

      if (!updatedListing) {
        // Version mismatch - retry
        console.log(`Concurrency conflict on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))); // Exponential backoff
        continue;
      }

      bookingSuccess = true;

      // Calculate actual available slots
      const newConfirmedBookings = updatedListing.bookings ? updatedListing.bookings.filter(b => b.status === 'confirmed') : [];
      const newAvailableSlots = (updatedListing.maxSlots || 10) - newConfirmedBookings.length;

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
          availableSlots: newAvailableSlots,
          maxSlots: updatedListing.maxSlots || 10,
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

  // Calculate actual available slots after cancellation
  const confirmedBookings = listing.bookings ? listing.bookings.filter(b => b.status === 'confirmed') : [];
  const availableSlots = (listing.maxSlots || 10) - confirmedBookings.length;

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('bookingCancelled', {
      listingId: id,
      bookingId: bookingId,
      availableSlots: availableSlots,
      maxSlots: listing.maxSlots || 10,
      availableDates: getAvailableDates(listing.bookings)
    });
  }

  req.flash("success", "Booking cancelled successfully!");
  res.redirect(`/listings/${id}`);
}));

module.exports = router;
