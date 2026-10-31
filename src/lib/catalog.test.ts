import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { ENGINE_TOOLS, LEARNING_PATH, LEARNING_TOOLS } from "./catalog";
import { CALCULATORS } from "./engine/registry";
import { site } from "./site";
import { STUDY_MODULES, studyHref } from "./study";

const APP = join(process.cwd(), "src", "app");
const SRC = join(process.cwd(), "src");

/** The route a path maps to, ignoring route groups like (auth). A lesson (/study/<slug>) exists when its module does. */
const routeExists = (path: string) => {
  const lesson = path.match(/^\/study\/([^/]+)$/);
  if (lesson) return lesson[1] in STUDY_MODULES;
  return existsSync(join(APP, ...path.split("/").filter(Boolean), "page.tsx"));
};

function allSource(dir: string): string {
  let out = "";
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out += allSource(p);
    else if (/\.(tsx|ts)$/.test(f) && !f.endsWith(".test.ts")) out += readFileSync(p, "utf8");
  }
  return out;
}
const SOURCE = allSource(SRC);

const links = [
  ...LEARNING_PATH.flatMap((s) => s.topics.flatMap((t) => [{ href: t.href }, ...(t.pages ?? []), ...t.tools])),
  ...ENGINE_TOOLS,
  ...site.nav.flatMap((i) => ("items" in i ? [i.hub, ...i.items] : [i])),
];

describe("the site map", () => {
  it("lists exactly the engine's calculators", () => {
    assert.deepEqual(ENGINE_TOOLS.map((c) => c.slug).sort(), CALCULATORS.map((c) => c.slug).sort());
    for (const t of ENGINE_TOOLS) assert.ok(CALCULATORS.find((c) => c.slug === t.slug)!.standard.startsWith(t.standard), t.slug);
  });
  it("every link goes to a page that exists", () => {
    for (const l of links) {
      const path = l.href.split(/[?#]/)[0];
      assert.ok(routeExists(path), `no page for ${l.href}`);
    }
  });
  it("every #anchor exists as a tab or chapter id", () => {
    for (const l of links) {
      const hash = l.href.split("#")[1];
      if (!hash) continue;
      assert.ok(SOURCE.includes(`id: "${hash}"`) || SOURCE.includes(`id="${hash}"`), `no id ${hash} for ${l.href}`);
    }
  });
  it("every topic and every learning page is in the menu", () => {
    const learn = site.nav.find((i) => "items" in i && i.label === "קורסים");
    assert.ok(learn && "items" in learn);
    const hrefs = new Set(learn.items.map((i) => i.href));
    for (const s of LEARNING_PATH) for (const t of s.topics) for (const p of t.pages ?? [{ href: t.href }]) assert.ok(hrefs.has(p.href), p.href);
  });
  it("every lesson link opens a real screen or step", () => {
    for (const l of links) {
      const [path, query] = l.href.split("#")[0].split("?");
      if (!path.startsWith("/study/")) continue;
      const m = STUDY_MODULES[path.slice("/study/".length)];
      const params = new URLSearchParams(query);
      const screen = params.get("screen");
      const step = params.get("step");
      if (screen) assert.ok(m.screens.some((s) => s.id === screen), `no screen ${screen} in ${l.href}`);
      if (step) assert.ok(Number(step) >= 1 && Number(step) <= 4, `no step ${step} in ${l.href}`);
    }
  });
  it("every lesson belongs to a topic on the learning path, and every lesson link has its lesson", () => {
    const topics = LEARNING_PATH.flatMap((s) => s.topics);
    for (const m of Object.values(STUDY_MODULES)) assert.ok(topics.some((t) => t.href === m.backHref), `lesson ${m.slug}: no topic at ${m.backHref}`);
    for (const t of topics.filter((x) => x.lesson)) assert.ok(Object.values(STUDY_MODULES).some((m) => studyHref(m.slug) === t.lesson && m.backHref === t.href), `${t.id}: no lesson ${t.lesson}`);
  });
  it("the free course comes first, whole; every paid topic opens its first lesson or chapter as a taste", () => {
    const topics = LEARNING_PATH.flatMap((s) => s.topics);
    assert.equal(topics[0].tier, "free");
    for (const t of topics) {
      const lessons = Object.values(STUDY_MODULES).filter((m) => m.backHref === t.href);
      assert.equal(t.format === "lessons", lessons.length > 0, `${t.id}: format`);
      if (t.tier === "free") {
        assert.deepEqual(t.preview, [], `${t.id}: a free topic needs no preview`);
        continue;
      }
      assert.equal(t.preview.length, 1, `${t.id}: one free taste`);
      if (t.format === "lessons") assert.equal(STUDY_MODULES[t.preview[0]]?.n, 1, `${t.id}: the taste is lesson 1`);
      else {
        const page = readFileSync(join(APP, ...t.href.split("/").filter(Boolean), "page.tsx"), "utf8");
        // Chapter ids, in the page's order (a part of the page, "…-part", is not a chapter).
        const chapters = [...page.matchAll(/id: "([\w-]+)"/g)].map((m) => m[1]).filter((id) => !id.endsWith("-part"));
        assert.ok(chapters.length && chapters[0] === t.preview[0], `${t.id}: the taste ${t.preview[0]} is the page's first chapter (${chapters[0]})`);
      }
    }
  });
  it("every topic in the menu carries its plan", () => {
    const learn = site.nav.find((i) => "items" in i && i.label === "קורסים");
    assert.ok(learn && "items" in learn);
    for (const i of learn.items) assert.ok(i.tier, i.href);
  });
  it("every learning calculator is in the calculators menu", () => {
    const tools = site.nav.find((i) => "items" in i && i.label === "כלים");
    assert.ok(tools && "items" in tools);
    const hrefs = new Set(tools.items.map((i) => i.href));
    for (const t of [...LEARNING_TOOLS, ...ENGINE_TOOLS]) assert.ok(hrefs.has(t.href), t.href);
  });
});
