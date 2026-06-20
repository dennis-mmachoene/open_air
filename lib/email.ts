import nodemailer from "nodemailer";
import { env } from "./env";
import { site } from "./site";

const transport =
  env.AUTH_EMAIL_SERVER && env.AUTH_EMAIL_FROM
    ? nodemailer.createTransport(env.AUTH_EMAIL_SERVER)
    : null;

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Send an email. No-op (logs) when SMTP isn't configured. */
export async function sendEmail(mail: Mail): Promise<void> {
  if (!transport || !env.AUTH_EMAIL_FROM) {
    console.warn(`[email] SMTP not configured — skipped "${mail.subject}" to ${mail.to}`);
    return;
  }
  try {
    await transport.sendMail({ from: env.AUTH_EMAIL_FROM, ...mail });
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

// ---------------------------------------------------------------------------
// Templates — quiet, on-brand, plain enough to render anywhere.
// ---------------------------------------------------------------------------

function shell(heading: string, body: string): string {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1c1c1a">
  <h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
  ${body}
  <p style="margin-top:28px;font-size:12px;color:#a8a29e">${site.name} — a living gallery of color.</p>
</div>`;
}

export function welcomeEmail(to: string, name?: string | null): Mail {
  const hi = name ? `Hi ${name},` : "Welcome,";
  return {
    to,
    subject: `Welcome to ${site.name}`,
    text: `${hi}\n\nWelcome to ${site.name}. Browse the gallery, save palettes, and open any one in the Showroom.\n\n${site.url}/gallery`,
    html: shell(
      `Welcome to ${site.name}`,
      `<p>${hi}</p><p>Browse the gallery, save palettes you love, and watch any one dress a complete UI in the Showroom.</p>
       <p><a href="${site.url}/gallery" style="display:inline-block;background:#1c1c1a;color:#fafaf9;text-decoration:none;padding:10px 18px;border-radius:9999px">Explore the gallery</a></p>`,
    ),
  };
}

export function receiptEmail(
  to: string,
  opts: { amount: number; currency: string; plan: string; periodEnd?: Date | null },
): Mail {
  const amount = (opts.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: opts.currency.toUpperCase(),
  });
  const until = opts.periodEnd ? ` Your plan is active until ${opts.periodEnd.toLocaleDateString()}.` : "";
  return {
    to,
    subject: `Your ${site.name} receipt`,
    text: `Thanks for subscribing to ${site.name} ${opts.plan}. You were charged ${amount}.${until}`,
    html: shell(
      "Payment received",
      `<p>Thanks for subscribing to <strong>${site.name} ${opts.plan}</strong>.</p>
       <p>Amount charged: <strong>${amount}</strong>.${until}</p>
       <p><a href="${site.url}/account">Manage your subscription</a></p>`,
    ),
  };
}

export function paymentFailedEmail(to: string, plan: string): Mail {
  return {
    to,
    subject: `Payment failed for ${site.name}`,
    text: `We couldn't process your payment for ${site.name} ${plan}. Please update your payment method to keep your access.\n\n${site.url}/account`,
    html: shell(
      "Payment failed",
      `<p>We couldn't process your latest payment for <strong>${site.name} ${plan}</strong>.</p>
       <p>Please update your payment method to keep your Pro access — we'll retry automatically.</p>
       <p><a href="${site.url}/account" style="display:inline-block;background:#1c1c1a;color:#fafaf9;text-decoration:none;padding:10px 18px;border-radius:9999px">Update payment</a></p>`,
    ),
  };
}
