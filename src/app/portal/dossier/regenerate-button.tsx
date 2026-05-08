"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regeneratePatientDossier } from "./actions";

export function RegenerateButton() {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    const result = await regeneratePatientDossier();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => startTransition(go)}
        disabled={busy}
        className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-60"
      >
        {busy ? "Regenerating…" : "Regenerate dossier"}
      </button>
      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-brand-red)] font-medium mt-2"
        >
          {error}
        </p>
      )}
    </div>
  );
}
