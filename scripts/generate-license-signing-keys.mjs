import { generateKeyPairSync } from "node:crypto";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
console.log(
  "SELF_HOSTED_LICENSE_SIGNING_PRIVATE_KEY=" +
    Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64"),
);
console.log(
  "SELF_HOSTED_LICENSE_SIGNING_PUBLIC_KEY=" +
    Buffer.from(publicKey.export({ type: "spki", format: "pem" })).toString("base64"),
);
console.error(
  "Bewaar private key uitsluitend in de centrale secrets manager; commit geen van beide waarden in deze repository.",
);
