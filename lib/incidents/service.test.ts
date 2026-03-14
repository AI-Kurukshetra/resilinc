import { describe, expect, it } from "vitest";
import { buildPlaybookActions } from "@/lib/incidents/playbook";
import { canTransitionIncidentActionStatus } from "@/lib/incidents/service";

describe("incident playbook and transitions", () => {
  it("builds severity-specific playbook actions with expected due windows", () => {
    const base = "2026-03-14T10:00:00.000Z";

    const sev5 = buildPlaybookActions(5, base);
    const sev4 = buildPlaybookActions(4, base);

    expect(sev5).toHaveLength(4);
    expect(sev4).toHaveLength(4);
    expect(new Date(sev5[0].dueAt).toISOString()).toBe("2026-03-14T12:00:00.000Z");
    expect(new Date(sev4[0].dueAt).toISOString()).toBe("2026-03-14T16:00:00.000Z");
  });

  it("enforces allowed incident action state transitions", () => {
    expect(canTransitionIncidentActionStatus("todo", "doing")).toBe(true);
    expect(canTransitionIncidentActionStatus("todo", "blocked")).toBe(true);
    expect(canTransitionIncidentActionStatus("todo", "done")).toBe(false);

    expect(canTransitionIncidentActionStatus("doing", "done")).toBe(true);
    expect(canTransitionIncidentActionStatus("doing", "blocked")).toBe(true);
    expect(canTransitionIncidentActionStatus("doing", "todo")).toBe(false);

    expect(canTransitionIncidentActionStatus("blocked", "doing")).toBe(true);
    expect(canTransitionIncidentActionStatus("blocked", "done")).toBe(true);
    expect(canTransitionIncidentActionStatus("blocked", "todo")).toBe(false);

    expect(canTransitionIncidentActionStatus("done", "done")).toBe(true);
    expect(canTransitionIncidentActionStatus("done", "doing")).toBe(false);
  });
});
