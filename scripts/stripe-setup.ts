import "../lib/load-env";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set in .env.local");
  process.exit(1);
}
const stripe = new Stripe(key);

async function main() {
  const pro = await stripe.products.create({ name: "Open Air Pro" });
  const proMonthly = await stripe.prices.create({
    product: pro.id, currency: "usd", unit_amount: 800, recurring: { interval: "month" },
  });
  const proYearly = await stripe.prices.create({
    product: pro.id, currency: "usd", unit_amount: 7200, recurring: { interval: "year" },
  });

  const studio = await stripe.products.create({ name: "Open Air Studio" });
  const studioMonthly = await stripe.prices.create({
    product: studio.id, currency: "usd", unit_amount: 2400, recurring: { interval: "month" },
  });
  const studioYearly = await stripe.prices.create({
    product: studio.id, currency: "usd", unit_amount: 24000, recurring: { interval: "year" },
  });

  console.log("\nAdd these to .env.local:\n");
  console.log(`STRIPE_PRICE_PRO_MONTHLY="${proMonthly.id}"`);
  console.log(`STRIPE_PRICE_PRO_YEARLY="${proYearly.id}"`);
  console.log(`STRIPE_PRICE_STUDIO_MONTHLY="${studioMonthly.id}"`);
  console.log(`STRIPE_PRICE_STUDIO_YEARLY="${studioYearly.id}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
