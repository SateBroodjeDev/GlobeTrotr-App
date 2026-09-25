import assert from "node:assert/strict";
import test from "node:test";
import { objectStorageReadiness, readObjectStorageConfig } from "./object-storage-config.server.ts";

const valid = {
  OBJECT_STORAGE_PROVIDER: "hetzner_s3",
  OBJECT_STORAGE_ENDPOINT: "https://nbg1.your-objectstorage.com",
  OBJECT_STORAGE_REGION: "nbg1",
  OBJECT_STORAGE_USER_FILES_BUCKET: "globetrotr-user-files-prod",
  OBJECT_STORAGE_BACKUPS_BUCKET: "globetrotr-backups-prod",
  OBJECT_STORAGE_ACCESS_KEY_ID: "access-key",
  OBJECT_STORAGE_SECRET_ACCESS_KEY: "secret-key",
};

test("Supabase remains the safe default without S3 configuration", () => {
  assert.deepEqual(readObjectStorageConfig({}), { provider: "supabase" });
});

test("a complete private Hetzner configuration is accepted", () => {
  const config = readObjectStorageConfig(valid);
  assert.equal(config.provider, "hetzner_s3");
  assert.equal(config.userFilesBucket, "globetrotr-user-files-prod");
});

test("partial or unsafe S3 configuration is rejected without exposing a secret", () => {
  const partial = objectStorageReadiness({
    OBJECT_STORAGE_PROVIDER: "hetzner_s3",
    OBJECT_STORAGE_SECRET_ACCESS_KEY: "should-never-appear",
  });
  assert.equal(partial.configured, false);
  assert.equal(partial.error, "OBJECT_STORAGE_CONFIG_MISSING:OBJECT_STORAGE_USER_FILES_BUCKET");
  assert.doesNotMatch(JSON.stringify(partial), /should-never-appear/);
  assert.throws(
    () => readObjectStorageConfig({ ...valid, OBJECT_STORAGE_ENDPOINT: "http://nbg1.your-objectstorage.com" }),
    /OBJECT_STORAGE_ENDPOINT_MUST_USE_HTTPS/,
  );
});

test("user files and backups cannot share a bucket", () => {
  assert.throws(
    () => readObjectStorageConfig({ ...valid, OBJECT_STORAGE_BACKUPS_BUCKET: valid.OBJECT_STORAGE_USER_FILES_BUCKET }),
    /OBJECT_STORAGE_BUCKETS_MUST_DIFFER/,
  );
});
