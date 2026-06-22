import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../db/schema";

export type Plan = "free" | "pro" | "studio";

/** Manually override an application user's plan (billing oversight / comping). */
export async function setUserPlan(userId: string, plan: Plan): Promise<void> {
  const db = getDb();
  await db.update(users).set({ plan }).where(eq(users.id, userId));
}

export interface UserDetail {
  id: string;
  email: string | null;
  name: string | null;
  plan: string;
  handle: string | null;
  createdAt: Date;
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, plan: users.plan, handle: users.handle, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return (row as UserDetail) ?? null;
}
