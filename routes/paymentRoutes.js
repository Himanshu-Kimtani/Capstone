const express = require("express");
const router = express.Router();
const stripeService = require("../services/stripeService");
const { Event, User, Booking } = require("../models");

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("error", "You must be logged in to book tickets");
    res.redirect("/users/login");
  }
};

// Create a checkout session for an event
router.post(
  "/create-checkout-session/:eventId",
  isLoggedIn,
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const userId = req.session.user.id;
      const quantity = parseInt(req.body.quantity) || 1; // Get quantity from form data

      // Check if event exists
      const event = await Event.findByPk(eventId);
      if (!event) {
        req.flash("error", "Event not found");
        return res.redirect("/events");
      }

      // Check if user has already booked this event
      const existingBooking = await Booking.findOne({
        where: {
          userId: userId,
          eventId: eventId,
        },
      });

      if (existingBooking) {
        req.flash("error", "You have already booked this event");
        return res.redirect(`/events/${eventId}`);
      }

      // Create a Stripe checkout session
      const session = await stripeService.createCheckoutSession(
        event,
        req.session.user,
        quantity
      );

      // Redirect to checkout
      res.redirect(session.url);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      req.flash("error", "An error occurred while processing your request");
      res.redirect("/events");
    }
  }
);

// Handle successful payment
router.get("/payment/success", isLoggedIn, async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      req.flash("error", "Invalid session");
      return res.redirect("/events");
    }

    // Retrieve the session details
    const session = await stripeService.retrieveSession(sessionId);

    // Get the metadata with event and user IDs
    const { eventId, userId, quantity } = session.metadata;
    const ticketQuantity = parseInt(quantity) || 1;

    // Verify that the user in session matches the user who made the payment
    if (userId !== req.session.user.id.toString()) {
      req.flash("error", "User authentication mismatch");
      return res.redirect("/events");
    }

    // Check if booking already exists
    const existingBooking = await Booking.findOne({
      where: {
        userId: userId,
        eventId: eventId,
      },
    });

    if (!existingBooking) {
      // Create a booking record
      await Booking.create({
        userId: userId,
        eventId: eventId,
        paymentId: session.payment_intent,
        amount: session.amount_total / 100, // Convert cents to dollars
        purchaseDate: new Date(),
        status: "completed",
        tickets: ticketQuantity,
      });
    }

    req.flash(
      "success",
      `Thanks for your purchase! Your ${ticketQuantity} ticket(s) have been added to your profile.`
    );
    res.redirect("/users/tickets");
  } catch (error) {
    console.error("Error processing successful payment:", error);
    req.flash("error", "An error occurred while processing your payment");
    res.redirect("/events");
  }
});

module.exports = router;
