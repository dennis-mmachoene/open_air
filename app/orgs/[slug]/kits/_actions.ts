"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug } from "@/lib/orgs";
import { parseHexList } from "@/lib/color/repair";
import { createKit, updateKit, deleteKit, addAsset, updateAsset, deleteAsset } from "@/lib/brandkits";
import { getKit } from "@/lib/brandkits";
import { listReviewerEmails, memberEmail } from "@/lib/orgs";
import { getProposal } from "@/lib/kitproposals";
import { sendEmail, kitProposalEmail, kitDecisionEmail } from "@/lib/email";
import { site } from "@/lib/site";

async function org(slug: string) {
  const o = await getOrgBySlug(slug);
  if (!o) redirect("/orgs");
  return o;
}

export async function createKitAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  try {
    const kit = await createKit(o.id, user.id, name, description);
    redirect(`/orgs/${slug}/kits/${kit.slug}`);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    redirect(`/orgs/${slug}/kits?error=${encodeURIComponent((e as Error).message)}`);
  }
}

export async function deleteKitAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const kitId = String(formData.get("kitId"));
  await deleteKit(kitId, user.id);
  redirect(`/orgs/${slug}/kits`);
}

export async function updateKitAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const kitSlug = String(formData.get("kitSlug"));
  const kitId = String(formData.get("kitId"));
  await updateKit(kitId, user.id, { name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? "") });
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

export async function addAssetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const kitSlug = String(formData.get("kitSlug"));
  const kitId = String(formData.get("kitId"));
  const name = String(formData.get("name") ?? "");
  const hexes = parseHexList(String(formData.get("hexes") ?? ""));
  const notes = String(formData.get("notes") ?? "");
  try {
    await addAsset(kitId, user.id, { name, hexes, notes });
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

export async function updateAssetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const kitSlug = String(formData.get("kitSlug"));
  const assetId = String(formData.get("assetId"));
  const patch: { name?: string; hexes?: string[]; notes?: string } = {
    name: String(formData.get("name") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const hexRaw = String(formData.get("hexes") ?? "");
  if (hexRaw.trim()) patch.hexes = parseHexList(hexRaw);
  try {
    await updateAsset(assetId, user.id, patch);
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

export async function deleteAssetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const kitSlug = String(formData.get("kitSlug"));
  const assetId = String(formData.get("assetId"));
  await deleteAsset(assetId, user.id);
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

/* --- Review / approval workflow ----------------------------------------- */

export async function proposeAddAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  const kitSlug = String(formData.get("kitSlug"));
  const kitId = String(formData.get("kitId"));
  const name = String(formData.get("name") ?? "");
  const hexes = parseHexList(String(formData.get("hexes") ?? ""));
  const note = String(formData.get("note") ?? "");
  const { proposeChange } = await import("@/lib/kitproposals");
  try {
    await proposeChange(kitId, user.id, { type: "add_asset", name, hexes, note });
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  // Notify reviewers (best-effort).
  try {
    const reviewers = await listReviewerEmails(o.id);
    const kit = await getKit(o.id, kitSlug);
    const url = `${site.url.replace(/\/$/, "")}/orgs/${slug}/kits/${kitSlug}`;
    const proposer = user.name ?? user.email ?? "A teammate";
    await Promise.all(reviewers.map((to) => sendEmail(kitProposalEmail(to, { orgName: o.name, kitName: kit?.name ?? "a brand kit", proposerName: proposer, summary: `Add “${name}” (${hexes.join(", ")})`, reviewUrl: url }))));
  } catch { /* email is non-critical */ }
  redirect(`/orgs/${slug}/kits/${kitSlug}?proposed=1`);
}

export async function proposeRemoveAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  const kitSlug = String(formData.get("kitSlug"));
  const kitId = String(formData.get("kitId"));
  const targetAssetId = String(formData.get("assetId"));
  const note = String(formData.get("note") ?? "");
  const { proposeChange } = await import("@/lib/kitproposals");
  try {
    await proposeChange(kitId, user.id, { type: "delete_asset", targetAssetId, note });
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  // Notify reviewers (best-effort).
  try {
    const reviewers = await listReviewerEmails(o.id);
    const kit = await getKit(o.id, kitSlug);
    const url = `${site.url.replace(/\/$/, "")}/orgs/${slug}/kits/${kitSlug}`;
    const proposer = user.name ?? user.email ?? "A teammate";
    await Promise.all(reviewers.map((to) => sendEmail(kitProposalEmail(to, { orgName: o.name, kitName: kit?.name ?? "a brand kit", proposerName: proposer, summary: "Remove an asset", reviewUrl: url }))));
  } catch { /* email is non-critical */ }
  redirect(`/orgs/${slug}/kits/${kitSlug}?proposed=1`);
}

export async function approveProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  const kitSlug = String(formData.get("kitSlug"));
  const id = String(formData.get("id"));
  const { approveProposal } = await import("@/lib/kitproposals");
  const proposal = await getProposal(id);
  try {
    await approveProposal(id, user.id);
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  await notifyDecision(o, slug, kitSlug, proposal?.proposedBy, user.name ?? user.email ?? "An admin", true, null);
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

export async function rejectProposalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug"));
  const o = await org(slug);
  const kitSlug = String(formData.get("kitSlug"));
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "");
  const { rejectProposal } = await import("@/lib/kitproposals");
  const proposal = await getProposal(id);
  try {
    await rejectProposal(id, user.id, note);
  } catch (e) {
    redirect(`/orgs/${slug}/kits/${kitSlug}?error=${encodeURIComponent((e as Error).message)}`);
  }
  await notifyDecision(o, slug, kitSlug, proposal?.proposedBy, user.name ?? user.email ?? "An admin", false, note || null);
  revalidatePath(`/orgs/${slug}/kits/${kitSlug}`);
}

async function notifyDecision(
  o: { id: string; name: string },
  slug: string,
  kitSlug: string,
  proposedBy: string | undefined,
  reviewerName: string,
  approved: boolean,
  note: string | null,
): Promise<void> {
  try {
    if (!proposedBy) return;
    const to = await memberEmail(proposedBy);
    if (!to) return;
    const kit = await getKit(o.id, kitSlug);
    const url = `${site.url.replace(/\/$/, "")}/orgs/${slug}/kits/${kitSlug}`;
    await sendEmail(kitDecisionEmail(to, { orgName: o.name, kitName: kit?.name ?? "a brand kit", approved, reviewerName, note, kitUrl: url }));
  } catch { /* email is non-critical */ }
}
