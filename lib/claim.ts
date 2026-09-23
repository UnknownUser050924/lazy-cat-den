import { createHash, randomBytes } from "crypto";

export function newClaim() {
  return randomBytes(18).toString("base64url");
}

export function hashClaim(claim: string) {
  return createHash("sha256").update(claim).digest("hex");
}

export function claimMatches(hash: string | undefined, claim: string | undefined) {
  return Boolean(hash && claim && hash === hashClaim(claim));
}
