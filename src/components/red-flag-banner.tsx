import Link from "next/link";
import type { ActiveRedFlagEvent } from "@/lib/clinical/red-flags";

// Persistent red-flag banner shown above the main content on patient and
// clinician layouts whenever an active red flag event exists for the
// current patient. The banner cannot be dismissed in this rendering —
// resolution happens on /portal/check via the patient's response action.
//
// Visual treatment is the dedicated `.red-flag-banner` utility token
// (urgent-100 background, urgent-700 left border, urgent-800 type)
// declared in globals.css. The audit trail is patient-accessible at
// /portal/check.

const RULE_HEADLINES: Record<string, { headline: string; action: string }> = {
  heavy_acute_bleeding: {
    headline: "Heavy bleeding — seek urgent care now",
    action: "Soaking through more than one pad an hour for two hours needs urgent assessment.",
  },
  ovarian_torsion_suspect: {
    headline: "Sudden severe one-sided pain — seek urgent care now",
    action: "This kind of pain can be a time-critical surgical emergency.",
  },
  bowel_obstruction_suspect: {
    headline: "Severe abdominal swelling — seek urgent care now",
    action: "Possible bowel obstruction. Don't wait.",
  },
  severe_ureteric_involvement: {
    headline: "Severe flank pain — seek urgent care now",
    action: "Possible kidney or urinary tract problem.",
  },
  ectopic_or_pregnancy_complication: {
    headline: "Bleeding in pregnancy — seek urgent care now",
    action: "Bleeding while pregnant or possibly pregnant needs urgent assessment.",
  },
};

export function RedFlagBannerStack({
  events,
  audience,
}: {
  events: ActiveRedFlagEvent[];
  audience: "patient" | "clinician";
}) {
  if (events.length === 0) return null;
  return (
    <div className="border-b border-[var(--color-brand-red)]" role="alert">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 space-y-2">
        {events.map((e) => {
          const text = RULE_HEADLINES[e.ruleId] ?? {
            headline: "Red flag — seek urgent care",
            action: "An urgent triage rule fired on your record.",
          };
          return (
            <div
              key={e.id}
              className="red-flag-banner flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-0.5">
                  Red flag
                </p>
                <p className="font-bold">{text.headline}</p>
                <p className="text-sm font-normal opacity-95">{text.action}</p>
              </div>
              <div className="flex gap-2">
                {audience === "patient" ? (
                  <>
                    <a
                      href="tel:111"
                      className="inline-flex items-center px-4 py-2 rounded-[8px] bg-white text-[var(--color-brand-red)] font-semibold text-sm hover:bg-[var(--color-brand-cream)] transition-colors"
                    >
                      Call 111
                    </a>
                    <Link
                      href="/portal/check"
                      className="inline-flex items-center px-4 py-2 rounded-[8px] border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      Manage flags
                    </Link>
                  </>
                ) : (
                  <span className="text-xs uppercase tracking-[0.14em] text-white/85 font-semibold">
                    Patient-active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
