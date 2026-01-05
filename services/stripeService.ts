import { loadStripe } from "@stripe/stripe-js";
import { PlanLevel } from "../types";

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

// Mapping PlanLevel to Stripe Price IDs
// These should be set in environment variables or hardcoded if necessary
const PLAN_PRICE_IDS: Record<Exclude<PlanLevel, 'free'>, string> = {
    premium: import.meta.env.VITE_STRIPE_PRICE_PREMIUM || "price_premium_placeholder",
    executive: import.meta.env.VITE_STRIPE_PRICE_EXECUTIVE || "price_executive_placeholder",
    ultimate: import.meta.env.VITE_STRIPE_PRICE_ULTIMATE || "price_ultimate_placeholder"
};

export const createCheckoutSession = async (plan: PlanLevel, userEmail: string) => {
    if (plan === 'free') return;

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) {
        throw new Error(`Price ID not found for plan: ${plan}`);
    }

    // In a real app, you would call your backend to create a Stripe Checkout Session
    // For this demo/frontend-only setup, we can't securely create a session without a backend secret key.
    // We will simulate the redirect or warn the user.

    if (import.meta.env.Dev && !import.meta.env.VITE_API_URL) {
        console.warn("No backend URL configured. mocking checkout redirect.");
        alert(`[MOCK CHECKOUT] Redirecting to Stripe for ${plan} plan ($${priceId})...`);
        return;
    }

    // Example backend call:
    /*
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, email: userEmail }),
    });
    const session = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: session.id });
    */

    throw new Error("Backend integration required for real Stripe payments. Please see implementation_plan.md");
};
