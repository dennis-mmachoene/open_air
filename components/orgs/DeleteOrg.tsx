"use client";

import { useState } from "react";
import { deleteOrgAction } from "@/app/orgs/[slug]/_danger-actions";

export function DeleteOrg({ slug, name }: { slug: string; name: string }) {
  const [text, setText] = useState("");
  const armed = text === name;
  return (
    <form action={deleteOrgAction} className="flex flex-col gap-2">
      <input type="hidden" name="slug" value={slug} />
      <label className="text-sm text-text-soft">
        Type <span className="font-mono text-text">{name}</span> to permanently delete this team and all its data.
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          name="confirm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={name}
          className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-p-danger focus:outline-none"
        />
        <button
          type="submit"
          disabled={!armed}
          className="rounded-pill bg-p-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Delete team
        </button>
      </div>
    </form>
  );
}
