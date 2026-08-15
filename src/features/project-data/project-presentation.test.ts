import { describe, expect, it } from "vitest";
import {
  findStateIntervalOverlaps,
  getLocalProjectPresentation,
  LOCAL_PROJECT_CLIENT_KEYS,
  type CharacterStateIntervalViewModel,
} from "./project-presentation";

describe("local project presentation boundary", () => {
  it("provides two distinct local projects without authoritative refs", () => {
    expect(LOCAL_PROJECT_CLIENT_KEYS).toEqual(["future-city", "amber-archive"]);

    const futureCity = getLocalProjectPresentation("future-city");
    const amberArchive = getLocalProjectPresentation("amber-archive");

    expect(futureCity.display.worldTitle).toBe("未来之城");
    expect(amberArchive.display.worldTitle).toBe("琥珀档案");
    expect(futureCity.display.characterName).not.toBe(amberArchive.display.characterName);

    for (const project of [futureCity, amberArchive]) {
      expect(project.dataOrigin).toBe("LOCAL_FIXTURE");
      expect(project.authoritative).toBe(false);
      expect(project.refs).toEqual({ projectRef: null, seriesRef: null, episodeRef: null });
      expect(project.characterStudio.characterRef).toBeNull();
    }
  });

  it("fails closed for an unregistered route client key", () => {
    const project = getLocalProjectPresentation("route-only-key");
    expect(project.clientKey).toBe("route-only-key");
    expect(project.display.projectTitle).toBe("未连接项目");
    expect(project.storyWorld.planItems).toEqual([]);
    expect(project.refs.projectRef).toBeNull();
  });
});

describe("character interval overlap validation", () => {
  const planItems = getLocalProjectPresentation("future-city").storyWorld.planItems;
  const base: CharacterStateIntervalViewModel = {
    clientKey: "one",
    intervalRef: null,
    characterRef: null,
    category: "Appearance",
    startPlanItemClientKey: "future-city-plan-01",
    endPlanItemClientKey: "future-city-plan-03",
    valueRef: null,
    annotation: "",
    continuityNotes: [],
  };

  it("detects overlap for the same character and exclusive category", () => {
    expect(
      findStateIntervalOverlaps(
        [
          base,
          {
            ...base,
            clientKey: "two",
            startPlanItemClientKey: "future-city-plan-02",
            endPlanItemClientKey: "future-city-plan-04",
          },
        ],
        planItems,
      ),
    ).toEqual(["one", "two"]);
  });

  it("treats touching start-inclusive/end-exclusive ranges as non-overlapping", () => {
    expect(
      findStateIntervalOverlaps(
        [
          base,
          {
            ...base,
            clientKey: "two",
            startPlanItemClientKey: "future-city-plan-03",
            endPlanItemClientKey: "future-city-plan-04",
          },
        ],
        planItems,
      ),
    ).toEqual([]);
  });
});

