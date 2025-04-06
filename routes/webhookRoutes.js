const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Booking } = require("../models");

// Webhook endpoint for Stripe
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Get metadata
      const { userId, eventId, quantity } = session.metadata;
      const ticketQuantity = parseInt(quantity) || 1;

      try {
        // Check if booking already exists
        const existingBooking = await Booking.findOne({
          where: {
            userId: userId,
            eventId: eventId,
          },
        });

        if (!existingBooking) {
          // Create booking record
          await Booking.create({
            userId: userId,
            eventId: eventId,
            paymentId: session.payment_intent,
            amount: session.amount_total / 100, // Convert cents to dollars
            purchaseDate: new Date(),
            status: "completed",
            tickets: ticketQuantity,
          });
          console.log(
            `Created booking for user ${userId} and event ${eventId} with ${ticketQuantity} tickets`
          );
        } else {
          console.log(
            `Booking already exists for user ${userId} and event ${eventId}`
          );
        }
      } catch (error) {
        console.error("Error creating booking from webhook:", error);
      }
    }

    // Return success
    res.status(200).send();
  }
);

module.exports = router;
