import { describe, it, expect } from "vitest";
import {
  BASE_VOICE_RULES,
  PATIENT_VOICE,
  CLINICIAN_VOICE,
  buildSystemPrompt,
} from "@/lib/llm/audience";

describe("buildSystemPrompt", () => {
  it("always begins with the base voice rules", () => {
    const prompt = buildSystemPrompt("patient", "Task: example.");
    expect(prompt.startsWith(BASE_VOICE_RULES)).toBe(true);
  });

  it("injects the patient voice block for patient audience", () => {
    const prompt = buildSystemPrompt("patient", "Task: example.");
    expect(prompt).toContain(PATIENT_VOICE);
    expect(prompt).not.toContain(CLINICIAN_VOICE);
  });

  it("injects the clinician voice block for clinician audience", () => {
    const prompt = buildSystemPrompt("clinician", "Task: example.");
    expect(prompt).toContain(CLINICIAN_VOICE);
    expect(prompt).not.toContain(PATIENT_VOICE);
  });

  it("appends the task block last so it cannot suppress the voice rules", () => {
    const taskBlock = "Task: example.";
    const prompt = buildSystemPrompt("patient", taskBlock);
    expect(prompt.endsWith(taskBlock)).toBe(true);
  });

  it("base rules contain the diagnostic-conclusion hard refusal", () => {
    expect(BASE_VOICE_RULES).toMatch(/never produce statements/i);
    expect(BASE_VOICE_RULES).toMatch(/diagnos/i);
  });

  it("base rules name the regulated framing", () => {
    expect(BASE_VOICE_RULES).toMatch(/Class IIa/);
    expect(BASE_VOICE_RULES).toMatch(/UK MDR/);
  });

  it("base rules forbid disallowed words", () => {
    expect(BASE_VOICE_RULES).toMatch(/genuinely/);
    expect(BASE_VOICE_RULES).toMatch(/honestly/);
    expect(BASE_VOICE_RULES).toMatch(/straightforward/);
  });
});
