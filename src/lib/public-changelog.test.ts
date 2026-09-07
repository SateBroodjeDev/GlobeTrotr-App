import assert from "node:assert/strict";
import { test } from "node:test";
import { PUBLIC_BETA_STATUS, PUBLIC_RELEASES } from "./public-changelog.ts";

test("beta status clearly lists intentionally unavailable features", () => {
  assert.ok(PUBLIC_BETA_STATUS.label.trim());
  assert.ok(PUBLIC_BETA_STATUS.description.trim());
  assert.ok(PUBLIC_BETA_STATUS.unavailable.length > 0);
  assert.equal(new Set(PUBLIC_BETA_STATUS.unavailable).size, PUBLIC_BETA_STATUS.unavailable.length);
});

test("public releases have unique IDs and versions", () => {
  assert.equal(new Set(PUBLIC_RELEASES.map((release) => release.id)).size, PUBLIC_RELEASES.length);
  assert.equal(
    new Set(PUBLIC_RELEASES.map((release) => release.version)).size,
    PUBLIC_RELEASES.length,
  );
});

test("public releases use explicit timestamps and newest-first order", () => {
  const timestamps = PUBLIC_RELEASES.map((release) => {
    assert.match(release.publishedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/);
    const parsed = Date.parse(release.publishedAt);
    assert.ok(Number.isFinite(parsed), `${release.id} heeft geen geldige publicatietijd`);
    return parsed;
  });
  assert.deepEqual(
    timestamps,
    [...timestamps].sort((left, right) => right - left),
  );
});

test("public release text is complete, unique and safe to publish", () => {
  const titles = new Set<string>();
  const forbidden = /(api[_ -]?key|service[_ -]?role|password|secret|token\s*[:=]|@example\.)/i;
  for (const release of PUBLIC_RELEASES) {
    assert.ok(release.title.trim());
    assert.ok(release.summary.trim());
    assert.ok(release.changes.length > 0);
    assert.doesNotMatch(`${release.title} ${release.summary}`, forbidden);
    for (const change of release.changes) {
      assert.ok(change.title.trim());
      assert.ok(change.description.trim());
      assert.equal(titles.has(change.title), false, `Dubbele wijzigingstitel: ${change.title}`);
      assert.doesNotMatch(`${change.title} ${change.description}`, forbidden);
      titles.add(change.title);
    }
  }
});
