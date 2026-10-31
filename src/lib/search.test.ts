import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalize, scoreItem, search, type SearchItem } from "./search";

const item = (title: string, kind: SearchItem["kind"] = "concept", hint = ""): SearchItem => ({ kind, title, hint, href: `/x/${title}` });

describe("quick search", () => {
  it("meets the query halfway: niqqud, geresh, quotes, punctuation and case", () => {
    assert.equal(normalize("ז׳ — זְכוּת"), "ז זכות");
    assert.equal(normalize('דו"ח IAS-16'), "דוח ias 16");
    assert.equal(scoreItem(item("IAS 16 · רכוש קבוע", "tool"), "ias16") > 0, false, "no fuzzy joining of words");
    assert.ok(scoreItem(item("IAS 16 · רכוש קבוע", "tool"), "ias 16") > 0);
  });
  it("ranks an exact title, then a start, then a word, then the middle, then the hint", () => {
    const q = "פחת";
    const s = (t: string, hint = "") => scoreItem(item(t, "concept", hint), q);
    assert.ok(s("פחת") > s("פחת נצבר"));
    assert.ok(s("פחת נצבר") > s("שיטות פחת"));
    assert.ok(s("שיטות פחת") > s("הפחתה"));
    assert.ok(s("הפחתה") > s("סימולטור", "שיטות הפחת"));
    assert.equal(s("מזומן"), 0);
  });
  it("needs every word of a longer query", () => {
    assert.ok(scoreItem(item("רישום כפול ופקודה פשוטה"), "פקודה כפול") > 0);
    assert.equal(scoreItem(item("רישום כפול ופקודה פשוטה"), "פקודה מורכבת"), 0);
  });
  it("orders ties by kind (courses before concepts), and shows nothing for an empty query", () => {
    const items = [item("מלאי", "concept"), item("מלאי", "course"), item("מזומן", "lesson")];
    assert.deepEqual(
      search(items, "מלאי").map((i) => i.kind),
      ["course", "concept"],
    );
    assert.deepEqual(search(items, "  "), []);
  });
});
