"use client";

import { useState } from "react";
import { loginAction } from "@/app/sys/_actions";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  return (
    <form action={loginAction} onSubmit={() => setPending(true)} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-soft">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-xl border border-border bg-canvas px-3 py-2.5 text-text focus:border-text focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-soft">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border border-border bg-canvas px-3 py-2.5 text-text focus:border-text focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-text px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
