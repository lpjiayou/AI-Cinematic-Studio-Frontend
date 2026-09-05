import { describe, expect, expectTypeOf, it } from "vitest";
import type { K2ProductionStateProjectionEnvelope } from "@/features/core-integration/contracts";
import { productionTruthProjection } from "@/features/core-integration/state-projection-test-fixtures";
import { productionTruthHold } from "./production-truth";

describe("production truth holds", () => {
  it("keeps the public state enums closed at compile time", () => {
    expectTypeOf<K2ProductionStateProjectionEnvelope["activeRevision"]["state"]>().toEqualTypeOf<"ACTIVE" | "NOT_RECORDED" | "BLOCKED_AMBIGUOUS" | "STALE_BLOCKED">();
    expectTypeOf<K2ProductionStateProjectionEnvelope["visualQcState"]["state"]>().toEqualTypeOf<"BLOCKED_AMBIGUOUS" | "NOT_RECORDED" | "IN_PROGRESS" | "FAIL" | "PASS" | "STALE" | "STALE_BLOCKED">();
    const fixture: K2ProductionStateProjectionEnvelope = productionTruthProjection("stale-revision");
    expect(fixture.activeRevision.activationState).toBe("STALE");
  });

  it("explains both expired activation and blocked historical QC", () => {
    expect(productionTruthHold(productionTruthProjection("stale-revision")).map((item) => item.title)).toEqual([
      "素材版本已经变化，需要重新审查", "当前修订已过期，质检保持阻断",
    ]);
  });

  it("explains stale QC independently of activation", () => {
    expect(productionTruthHold(productionTruthProjection("stale-qc"))).toEqual([
      { title: "视觉质检基于旧候选", description: "候选或素材版本已经变化，现有视觉质检不能证明当前版本通过。" },
    ]);
  });

  it.each(["NOT_RECORDED", "BLOCKED_AMBIGUOUS", "IN_PROGRESS", "FAIL", "PASS"] as const)("does not relabel %s as stale", (state) => {
    const payload = productionTruthProjection();
    expect(productionTruthHold({ ...payload, visualQcState: { ...payload.visualQcState, state } })).toEqual([]);
  });

  it("does not label unavailable truth as stale", () => {
    expect(productionTruthHold(null)).toEqual([]);
  });
});
