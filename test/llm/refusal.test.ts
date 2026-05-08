import { describe, it, expect } from "vitest";
import { detectsDiagnosticConclusion } from "@/lib/llm/refusal";

// Defence-in-depth filter. The system prompt is the primary control; this
// regex sweep is what catches the case where the prompt regresses or the
// model output drifts. Tests are deliberately a mix of clear positives,
// clear negatives, and the hedged framings the brief explicitly permits.

describe("detectsDiagnosticConclusion", () => {
  describe("refuses diagnostic-shaped statements", () => {
    const positives = [
      "You have endometriosis.",
      "The patient has endometriosis based on these findings.",
      "She has adenomyosis.",
      "This is endometriosis.",
      "Diagnosis of endometriosis confirmed.",
      "Diagnosed with adenomyosis at age 32.",
      "These findings confirm endometriosis.",
    ];
    for (const text of positives) {
      it(`flags: ${text}`, () => {
        expect(detectsDiagnosticConclusion(text)).toBe(true);
      });
    }
  });

  describe("permits hedged or factual framings", () => {
    const negatives = [
      "Findings are suggestive of endometriosis.",
      "Symptoms are consistent with endometriosis.",
      "Considerations for endometriosis.",
      "Suspected endometriosis pending laparoscopy.",
      "Possible adenomyosis on imaging.",
      "Known endometriosis stage II from prior laparoscopy.",
      "Prior endometriosis surgery in 2024.",
      "Patient reports no family history of endometriosis.",
      "TVS showed features of adenomyosis.",
    ];
    for (const text of negatives) {
      it(`permits: ${text}`, () => {
        expect(detectsDiagnosticConclusion(text)).toBe(false);
      });
    }
  });

  it("evaluates each sentence independently", () => {
    const mixed =
      "Symptoms are suggestive of endometriosis. The patient has endometriosis.";
    expect(detectsDiagnosticConclusion(mixed)).toBe(true);
  });
});
