"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, useToast } from "@/components/ui";

const REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "offensive", label: "Offensive or hateful" },
  { id: "copyright", label: "Copyright violation" },
  { id: "other", label: "Something else" },
];

export function ReportButton({ id }: { id: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [done, setDone] = useState(false);
  const { success } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    setBusy(true);
    try {
      await fetch(`/api/publish/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setDone(true);
      setOpen(false);
      success("Reported — thank you");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="text-xs text-text-muted">Reported — thank you.</span>;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-text-muted underline-offset-4 hover:text-text-soft hover:underline"
      >
        Report
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-60 rounded-control border border-border bg-canvas p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-text">Why are you reporting this?</p>
          <div className="flex flex-col gap-1">
            {REASONS.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm text-text-soft">
                <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
                {r.label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-control px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Cancel</button>
            <Button size="sm" onClick={submit} loading={busy}>Submit</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
