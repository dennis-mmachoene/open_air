import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Require a signed-in user in a Server Component / page. Redirects to /signin. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return session.user;
}
