"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug } from "@/lib/orgs";
import { addDomain, verifyDomain, setDomainAutoJoin, removeDomain } from "@/lib/org-domains";

async function org(slug: string) {
  const o = await getOrgBySlug(slug);
  if (!o) redirect("/orgs");
  return o;
}

export async function addDomainAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  try {
    await addDomain(o.id, user.id, String(formData.get("domain") ?? ""));
  } catch (e) {
    redirect(`/orgs/${slug}/domains?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/orgs/${slug}/domains`);
}

export async function verifyDomainAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  try {
    await verifyDomain(String(formData.get("id")), user.id);
  } catch (e) {
    redirect(`/orgs/${slug}/domains?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/orgs/${slug}/domains`);
}

export async function toggleAutoJoinAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  await setDomainAutoJoin(String(formData.get("id")), user.id, formData.get("on") === "1");
  revalidatePath(`/orgs/${slug}/domains`);
}

export async function removeDomainAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  await removeDomain(String(formData.get("id")), user.id);
  revalidatePath(`/orgs/${slug}/domains`);
}
