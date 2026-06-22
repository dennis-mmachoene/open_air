This Data Processing & Security Statement describes how Open Air (operated by Open Air) processes and protects personal information, and lists the sub-processors (operators) we rely on. It supports our [Privacy Policy](/legal/privacy) and is relevant to users and any business customers who need diligence information.

## 1. Roles

For the personal information we process about our users, Open Air acts as the **responsible party** (POPIA) / **data controller** (GDPR/UK GDPR). The third-party providers listed below act as **operators** / **processors** (or, where they determine their own purposes, as independent controllers).

## 2. Categories of data processed

- **Identity & account:** email address, name, profile image (from Google).
- **User content:** saved palettes, generated palettes, collections and their names.
- **Billing:** subscription status, plan, and a payment-processor customer identifier (no full card data).
- **Technical & usage:** device and browser data, IP-derived approximate location, product-analytics events, error diagnostics.
- **Security:** hashed API keys, rate-limiting counters, webhook event records.

## 3. Purposes and lawful bases

These are described in section 3 of the [Privacy Policy](/legal/privacy).

## 4. Sub-processors

We use the following providers to deliver the Service. Each processes data only as needed to provide its service to us, under its own terms and security commitments.

| Provider | Function | Data involved |
|---|---|---|
| Google (OAuth & Gemini) | Authentication and the AI assistant | Email/name/profile (sign-in); prompt text (AI) |
| Stripe | Payment processing and billing | Billing metadata, customer identifier (card data handled by Stripe) |
| Neon | Managed Postgres database hosting | Account and user-content data at rest |
| Upstash | Rate limiting | Request counters / identifiers |
| PostHog | Product analytics | Usage events, device/technical data |
| Sentry | Error and performance monitoring | Diagnostic/error data |
| Email delivery (SMTP) | Transactional and sign-in emails | Email address, message content |
| Cloud hosting/CDN | Application hosting and delivery | Request data in transit |

We may update this list as our infrastructure evolves; the current list is maintained here.

## 5. International transfers

Providers may process data outside South Africa, including in the EU, UK, and US. We rely on lawful transfer mechanisms appropriate to each framework (POPIA section 72; GDPR/UK GDPR adequacy or Standard Contractual Clauses).

## 6. Security measures

We apply technical and organisational measures appropriate to the risk, including:

- **Encryption in transit** via HTTPS/TLS, enforced by HTTP Strict Transport Security.
- **Security headers** including content-security, anti-framing, and content-type protections.
- **Authentication** that is passwordless (no stored passwords) with database-backed sessions.
- **Server-side authorisation:** entitlements and admin access are enforced on the server, never trusted from the client; admin access is restricted to an allow-list.
- **Hashed secrets:** API keys are stored hashed, not in plaintext.
- **Payment integrity:** payment webhooks are signature-verified and processed idempotently.
- **Rate limiting and abuse controls** on sensitive and AI endpoints, with budget ceilings.
- **Least-privilege access** to production systems and **environment-validation** that fails closed when critical configuration is missing.
- **Error monitoring** to detect and respond to issues.

No system is perfectly secure, but we work to protect data and to respond to incidents appropriately.

## 7. Data retention and deletion

Retention is described in the [Privacy Policy](/legal/privacy). When you delete your Account, we remove your profile, saved palettes, collections, generated palettes, and API keys, and cancel any active subscription; residual backup copies are overwritten in the ordinary course.

## 8. Data subject requests

You can access, correct, export, or delete your data from your account settings or by contacting us. We assist business customers in responding to data-subject requests where we act as their operator.

## 9. Personal-information breaches

If a security compromise affecting your personal information occurs, we will notify the relevant regulator and affected users where required by POPIA or other applicable law, and take reasonable steps to mitigate harm.

## 10. Contact

Data-protection and security enquiries: **openair.mailer@gmail.com**.
