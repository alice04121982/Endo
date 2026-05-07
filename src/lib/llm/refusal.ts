// Defence-in-depth: even with the system prompt forbidding diagnostic
// conclusions, we screen model output for diagnostic-shaped sentences and
// refuse them at the gateway. This is a coarse filter, not the primary
// control. It exists so a single prompt regression cannot leak a diagnosis
// into a clinical surface.

const DIAGNOSTIC_PATTERNS: RegExp[] = [
  /\b(you|the patient|she)\s+(has|have)\s+(endometriosis|adenomyosis)\b/i,
  /\b(this|that)\s+is\s+(endometriosis|adenomyosis)\b/i,
  /\b(diagnos(ed|is)\s+of\s+(endometriosis|adenomyosis))\b/i,
  /\b(diagnos(ed|is)\s+with\s+(endometriosis|adenomyosis))\b/i,
  /\b(confirms?|confirmed)\s+(endometriosis|adenomyosis)\b/i,
];

// Allowed framings that contain the disease word but are not diagnostic.
// Used to suppress false positives in the regex sweep.
const ALLOWED_PATTERNS: RegExp[] = [
  /\b(suggestive of|consistent with|features of|considerations for)\b/i,
  /\b(suspected|possible|likely|probable)\s+(endometriosis|adenomyosis)\b/i,
  /\b(known|prior|previous)\s+(endometriosis|adenomyosis)\b/i,
];

export function detectsDiagnosticConclusion(text: string): boolean {
  if (!DIAGNOSTIC_PATTERNS.some((re) => re.test(text))) return false;
  // If the same sentence carries a hedging framing, treat as allowed. Coarse,
  // but sufficient for a defence-in-depth filter; the system prompt is the
  // primary control.
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (DIAGNOSTIC_PATTERNS.some((re) => re.test(sentence))) {
      if (!ALLOWED_PATTERNS.some((re) => re.test(sentence))) return true;
    }
  }
  return false;
}
