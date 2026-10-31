import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STUDY_MODULES } from "./index";
import { neighbours, percentOf, placeLabel, practiceGroups } from "./outline";
import { EMPTY_TOPIC, maxXp, practiceOf, subCount } from "./score";

const m = STUDY_MODULES["basics-intro"];
const last = { step: 0, sub: m.screens.length - 1 };

describe("lesson navigation, named", () => {
  it("names every place: a concept, the move into practice, a question, the summary", () => {
    assert.equal(placeLabel(m, { step: 0, sub: 0 }), m.screens[0].title);
    assert.equal(placeLabel(m, { step: 1, sub: 0 }), `עוברים לתרגול (${practiceOf(m).length} שאלות)`);
    assert.match(placeLabel(m, { step: 1, sub: 1 }), /^שאלה 1 · /);
    assert.equal(placeLabel(m, { step: 2, sub: 0 }), "סיכום וטיפים זהב");
  });
  it("from the opening, only forward — to the first concept", () => {
    const n = neighbours(m, { step: 0, sub: 0 }, true);
    assert.equal(n.prev, undefined);
    assert.equal(n.next?.label, m.screens[0].title);
  });
  it("the first concept leads back to the opening, the last into practice, the summary nowhere", () => {
    assert.equal(neighbours(m, { step: 0, sub: 0 }, false).prev?.label, "על השיעור");
    assert.deepEqual(neighbours(m, last, false).next?.place, { step: 1, sub: 0 });
    assert.equal(neighbours(m, { step: 2, sub: 0 }, false).next, undefined);
    assert.equal(neighbours(m, { step: 2, sub: 0 }, false).prev?.label, placeLabel(m, { step: 1, sub: subCount(m, 1) - 1 }));
  });
});

describe("the lesson's outline in the course bar", () => {
  it("lists the practice by kind, with every question counted once and where each kind starts", () => {
    for (const lesson of Object.values(STUDY_MODULES)) {
      const groups = practiceGroups(lesson, EMPTY_TOPIC);
      assert.equal(
        groups.reduce((s, g) => s + g.n, 0),
        practiceOf(lesson).length,
        lesson.slug,
      );
      assert.equal(groups[0].place.sub, 1, `${lesson.slug}: the first kind starts at the first question`);
      for (const g of groups) assert.equal(practiceOf(lesson)[g.place.sub - 1].group.id, g.id);
    }
  });
  it("counts answered questions", () => {
    const first = practiceOf(m)[0];
    const p = first.kind === "trap" ? { ...EMPTY_TOPIC, traps: { [first.trap.id]: { choice: 0, correct: false } } } : { ...EMPTY_TOPIC, exercises: { [first.ex.id]: { tries: 2, ok: false, done: true } } };
    assert.equal(practiceGroups(m, p).find((g) => g.id === first.group.id)?.answered, 1);
  });
  it("puts a lesson's progress in whole percent", () => {
    assert.equal(percentOf(m, EMPTY_TOPIC), 0);
    assert.equal(percentOf(m, { ...EMPTY_TOPIC, seen: m.screens.map((_, i) => i) }), Math.round(((m.screens.length * 5) / maxXp(m)) * 100));
  });
});
