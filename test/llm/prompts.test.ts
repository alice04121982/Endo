import { describe, it, expect } from "vitest";
import { getTask, listTaskNames } from "@/lib/llm/prompts";

describe("task registry", () => {
  it("exposes the three v0 tasks", () => {
    expect(listTaskNames().sort()).toEqual([
      "clinician-freetext-qa",
      "extract-symptom-from-voice",
      "synth-csd-section",
    ]);
  });

  it("returns null for unknown task names", () => {
    expect(getTask("not-a-real-task")).toBeNull();
  });

  it("each task carries a versioned identifier", () => {
    for (const name of listTaskNames()) {
      const task = getTask(name);
      expect(task).not.toBeNull();
      expect(task!.version).toMatch(/^[a-z0-9-]+@\d+\.\d+\.\d+$/);
    }
  });

  it("clinician-freetext-qa requires citations and is clinician-only", () => {
    const task = getTask("clinician-freetext-qa")!;
    expect(task.requiresCitations).toBe(true);
    expect(task.audiences).toEqual(["clinician"]);
  });

  it("extract-symptom-from-voice attaches a default source-data citation", () => {
    const task = getTask("extract-symptom-from-voice")!;
    expect(task.defaultCitations).toBeDefined();
    const citations = task.defaultCitations!({
      utteranceId: "utt-123",
      transcript: "test",
    });
    expect(citations).toHaveLength(1);
    expect(citations[0].kind).toBe("source_data");
    if (citations[0].kind === "source_data") {
      expect(citations[0].sourceId).toBe("utt-123");
    }
  });

  it("rejects malformed inputs at the task input schema", () => {
    const task = getTask("extract-symptom-from-voice")!;
    expect(task.inputSchema.safeParse({ utteranceId: "x" }).success).toBe(false);
    expect(task.inputSchema.safeParse({ transcript: "y" }).success).toBe(false);
    expect(
      task.inputSchema.safeParse({ utteranceId: "x", transcript: "y" }).success,
    ).toBe(true);
  });
});
