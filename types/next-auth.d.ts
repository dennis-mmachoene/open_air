import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; plan: "free" | "pro" | "studio" } & DefaultSession["user"];
  }
}
