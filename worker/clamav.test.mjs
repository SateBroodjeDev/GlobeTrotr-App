import assert from "node:assert/strict";
import { createServer } from "node:net";
import test from "node:test";
import { parseClamAvResponse, scanBuffer } from "./clamav.mjs";

test("accepts an explicit clean ClamAV response", () => {
  assert.deepEqual(parseClamAvResponse("stream: OK\n"), { clean: true, signature: null });
});

test("identifies a malware signature and rejects unclear responses", () => {
  assert.deepEqual(parseClamAvResponse("stream: Eicar-Test-Signature FOUND\n"), {
    clean: false,
    signature: "Eicar-Test-Signature",
  });
  assert.throws(() => parseClamAvResponse("stream: size limit exceeded ERROR"), {
    message: "MALWARE_SCAN_UNCLEAR",
  });
  assert.throws(() => parseClamAvResponse("stream: ERROR OK"), {
    message: "MALWARE_SCAN_UNCLEAR",
  });
  assert.throws(() => parseClamAvResponse("unexpected: OK"), {
    message: "MALWARE_SCAN_UNCLEAR",
  });
});

test("streams an attachment and accepts only an explicit clean scanner reply", async () => {
  const payload = Buffer.from("safe attachment");
  let received = Buffer.alloc(0);
  const server = createServer({ allowHalfOpen: true }, (socket) => {
    socket.on("data", (chunk) => { received = Buffer.concat([received, chunk]); });
    socket.on("end", () => socket.end("stream: OK\n"));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    assert.deepEqual(await scanBuffer(payload, { host: "127.0.0.1", port, timeoutMs: 1_000 }), {
      clean: true, signature: null,
    });
    assert.equal(received.subarray(0, 10).toString(), "zINSTREAM\0");
    assert.equal(received.readUInt32BE(10), payload.length);
    assert.deepEqual(received.subarray(14, -4), payload);
    assert.equal(received.readUInt32BE(received.length - 4), 0);
  } finally {
    server.close();
  }
});

test("rejects an unavailable scanner instead of treating an attachment as clean", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  await assert.rejects(scanBuffer(Buffer.from("attachment"), { host: "127.0.0.1", port, timeoutMs: 1_000 }), {
    code: "MALWARE_SCANNER_UNAVAILABLE",
  });
});
