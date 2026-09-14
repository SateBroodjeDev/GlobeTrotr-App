import { test } from "node:test";
import assert from "node:assert/strict";
import { TripSaveQueue } from "./trip-save-queue.ts";

test("two local edits wait and use the acknowledged version", async () => {
  const queue = new TripSaveQueue();
  const calls: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = queue.enqueue({ id: "a", revision: "0", title: "one" }, async (trip) => {
    calls.push(`${trip.title}:${trip.revision}`);
    await gate;
    return { revision: "1" };
  });
  const second = queue.enqueue({ id: "a", revision: "0", title: "two" }, async (trip) => {
    calls.push(`${trip.title}:${trip.revision}`);
    return { revision: "2" };
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["one:0"]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(calls, ["one:0", "two:1"]);
});

test("a conflict or uncertain network failure blocks queued and later writes", async () => {
  const queue = new TripSaveQueue();
  let calls = 0;
  const save = async () => {
    calls++;
    throw new Error("conflict");
  };
  const first = queue.enqueue({ id: "a", revision: "0" }, save);
  const second = queue.enqueue({ id: "a", revision: "0" }, save);
  const results = await Promise.allSettled([first, second]);
  assert.ok(results.every((result) => result.status === "rejected"));
  await assert.rejects(queue.enqueue({ id: "a", revision: "1" }, save), /herlaad/);
  assert.equal(calls, 1);
  assert.equal(queue.isBlocked("a"), true);
  assert.deepEqual(
    await queue.enqueue({ id: "b", revision: "8" }, async () => ({ revision: "9" })),
    { revision: "9" },
  );
});

test("deleted trips cannot be written again by a queued snapshot", async () => {
  const queue = new TripSaveQueue();
  const deletion = queue.enqueue({ id: "a", revision: "3" }, async () => {
    queue.block("a");
    return { revision: "3" };
  });
  const lateSave = queue.enqueue({ id: "a", revision: "3" }, async () => {
    assert.fail("deleted trip must not be saved");
    return { revision: "4" };
  });
  await deletion;
  await assert.rejects(lateSave, /herlaad/);
});
