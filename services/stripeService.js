const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create a Stripe checkout session
async function createCheckoutSession(event, user, quantity = 1) {
  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: event.name,
              description: `Event Date: ${new Date(
                event.date
              ).toLocaleDateString()}`,
              images: [event.imageUrl || ""],
            },
            unit_amount: Math.round(event.price * 100), // Convert dollars to cents
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.BASE_URL}/events/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/events/${event.id}`,
      metadata: {
        userId: user.id,
        eventId: event.id,
        quantity: quantity.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Verify that a session was successfully completed
async function retrieveSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Error retrieving session:", error);
    throw error;
  }
}

module.exports = {
  createCheckoutSession,
  retrieveSession,
};
