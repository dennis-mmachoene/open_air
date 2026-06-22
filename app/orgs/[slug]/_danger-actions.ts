"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, deleteOrg } from "@/lib/orgs";

export async function deleteOrgAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const confirm = String(formData.get("confirm") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) redirect("/orgs");
  if (confirm !== org.name) {
    redirect(`/orgs/${slug}?error=${encodeURIComponent("Type the team name exactly to confirm deletion.")}`);
  }
  try {
    await deleteOrg(org.id, user.id);
  } catch (e) {
    redirect(`/orgs/${slug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect("/orgs");
}
