import assert from "node:assert/strict";
import test from "node:test";
import { groupMailThreads, mailThreadKey, messagesInThread } from "./mail-threads.ts";

const messages = [
  {
    id: "latest",
    thread_key: "message-a",
    provider_message_id: "message-b",
    received_at: "2026-09-21T10:05:00Z",
    subject: "Re: Trip",
  },
  {
    id: "first",
    thread_key: "message-a",
    provider_message_id: "message-a",
    received_at: "2026-09-21T10:00:00Z",
    subject: "Trip",
  },
  {
    id: "separate",
    thread_key: null,
    provider_message_id: "message-c",
    received_at: "2026-09-21T10:02:00Z",
    subject: "Invoice",
  },
];

test("uses a stable mail thread key with safe fallbacks", () => {
  assert.equal(mailThreadKey(messages[0]), "message-a");
  assert.equal(mailThreadKey(messages[2]), "message-c");
  assert.equal(mailThreadKey({ id: "local" }), "local");
});

test("groups conversations and returns their messages chronologically", () => {
  const groups = groupMailThreads(messages);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].threadCount, 2);
  assert.deepEqual(
    messagesInThread(messages, messages[0]).map((message) => message.id),
    ["first", "latest"],
  );
});
