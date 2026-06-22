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
// Branded, email-safe HTML shell + button (inline styles only).
// ---------------------------------------------------------------------------

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1c1c1a;color:#fafaf9;text-decoration:none;padding:11px 20px;border-radius:9999px;font-weight:500;font-size:14px">${label}</a>`;
}

function link(href: string, label: string): string {
  return `<a href="${href}" style="color:#1c1c1a;font-weight:500">${label}</a>`;
}

function shell(heading: string, bodyHtml: string): string {
  return `<div style="background:#fafaf9;padding:24px 12px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1c1c1a;line-height:1.5">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden">
    <div style="height:6px;background:linear-gradient(90deg,#6366f1,#0ea5e9,#14b8a6,#f59e0b,#ec4899)"></div>
    <div style="padding:28px 28px 8px">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;letter-spacing:-0.01em">Open Air</div>
    </div>
    <div style="padding:8px 28px 28px">
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;margin:8px 0 16px">${heading}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e7e5e4;font-size:12px;color:#a8a29e">
      ${site.name} — a living gallery of color. · ${link(site.url, "openair")}
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function welcomeEmail(to: string, name?: string | null): Mail {
  const hi = name ? `Hi ${name},` : "Welcome,";
  return {
    to,
    subject: `Welcome to ${site.name}`,
    text: `${hi}\n\nWelcome to ${site.name}. Browse the gallery, save palettes, and open any one in the Showroom.\n\n${site.url}/gallery`,
    html: shell(
      `Welcome to ${site.name}`,
      `<p style="margin:0 0 14px">${hi}</p>
       <p style="margin:0 0 20px;color:#57534e">Browse the gallery, save the palettes you love, and watch any one dress a complete UI in the Showroom — every palette is accessibility-checked by construction.</p>
       <p style="margin:0 0 8px">${button(`${site.url}/gallery`, "Explore the gallery")}</p>`,
    ),
  };
}

export function receiptEmail(
  to: string,
  opts: {
    amount: number;
    currency: string;
    plan: string;
    periodEnd?: Date | null;
    invoiceUrl?: string | null;
    pdfUrl?: string | null;
  },
): Mail {
  const amount = (opts.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: opts.currency.toUpperCase(),
  });
  const until = opts.periodEnd ? ` Active until ${opts.periodEnd.toLocaleDateString()}.` : "";
  const invoiceLinks = [
    opts.invoiceUrl ? link(opts.invoiceUrl, "View invoice") : null,
    opts.pdfUrl ? link(opts.pdfUrl, "Download PDF") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    to,
    subject: `Your ${site.name} receipt — ${amount}`,
    text: `Thanks for subscribing to ${site.name} ${opts.plan}. You were charged ${amount}.${until}${opts.invoiceUrl ? `\n\nInvoice: ${opts.invoiceUrl}` : ""}`,
    html: shell(
      "Payment received",
      `<p style="margin:0 0 14px">Thanks for subscribing to <strong>${site.name} ${opts.plan}</strong>.</p>
       <table style="width:100%;border-collapse:collapse;margin:0 0 18px">
         <tr><td style="padding:8px 0;color:#57534e">Plan</td><td style="padding:8px 0;text-align:right;font-weight:600">${opts.plan}</td></tr>
         <tr><td style="padding:8px 0;color:#57534e;border-top:1px solid #e7e5e4">Amount</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #e7e5e4">${amount}</td></tr>
       </table>
       <p style="margin:0 0 18px;color:#57534e">${until || "Thanks for supporting Open Air."}</p>
       ${invoiceLinks ? `<p style="margin:0 0 16px;font-size:14px">${invoiceLinks}</p>` : ""}
       <p style="margin:0">${button(`${site.url}/account`, "Manage subscription")}</p>`,
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
      `<p style="margin:0 0 14px">We couldn't process your latest payment for <strong>${site.name} ${plan}</strong>.</p>
       <p style="margin:0 0 20px;color:#57534e">Please update your payment method to keep your Pro access — we'll retry automatically.</p>
       <p style="margin:0">${button(`${site.url}/account`, "Update payment")}</p>`,
    ),
  };
}

export function orgInviteEmail(
  to: string,
  opts: { orgName: string; inviterName?: string | null; token: string },
): Mail {
  const url = `${site.url.replace(/\/$/, "")}/invite/${opts.token}`;
  const who = opts.inviterName ? `${opts.inviterName} invited you` : "You've been invited";
  return {
    to,
    subject: `Join ${opts.orgName} on Open Air`,
    text: `${who} to join the team "${opts.orgName}" on Open Air. Accept your invite: ${url}`,
    html: shell(
      `Join ${opts.orgName}`,
      `<p style="margin:0 0 16px">${who} to collaborate on color systems in the team <strong>${opts.orgName}</strong> on Open Air.</p>
       <p style="margin:0 0 24px">${button(url, "Accept invite")}</p>
       <p style="margin:0;font-size:13px;color:#78716c">Or paste this link into your browser:<br />${link(url, url)}</p>
       <p style="margin:16px 0 0;font-size:12px;color:#a8a29e">This invite expires in 14 days. If you weren't expecting it, you can ignore this email.</p>`,
    ),
  };
}
