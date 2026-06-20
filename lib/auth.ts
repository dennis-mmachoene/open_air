import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { getDb } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import { env } from "./env";

const db = env.DATABASE_URL ? getDb() : undefined;

const providers: Provider[] = [];
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Google verifies emails, so it's safe to link to an existing account
      // that used the same address via the email magic link.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}
if (env.AUTH_EMAIL_SERVER && env.AUTH_EMAIL_FROM) {
  providers.push(
    Nodemailer({ server: env.AUTH_EMAIL_SERVER, from: env.AUTH_EMAIL_FROM }),
  );
}

export const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
export const emailEnabled = Boolean(env.AUTH_EMAIL_SERVER && env.AUTH_EMAIL_FROM);
/** True when at least one provider + the database are configured. */
export const authEnabled = Boolean(db) && providers.length > 0;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: db
    ? DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  // DB-backed sessions when the adapter is present (required for magic links).
  session: { strategy: db ? "database" : "jwt" },
  providers,
  pages: { signIn: "/signin" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const plan = (user as { plan?: string }).plan;
        session.user.plan = plan === "pro" || plan === "studio" ? plan : "free";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      const { sendEmail, welcomeEmail } = await import("./email");
      await sendEmail(welcomeEmail(user.email, user.name));
    },
  },
});
