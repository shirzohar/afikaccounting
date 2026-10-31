import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-SHA256 webhook signatures, in the common "t=<unix seconds>,v1=<hex>"
 * header form: the signed text is "<t>.<raw body>", so a body can't be
 * replayed with another time, and a time too far from now is refused. The
 * sandbox provider signs this way; a real provider's adapter uses its own
 * scheme where it differs.
 */

/** How far (seconds) a signature's time may be from now. */
export const TOLERANCE_SECONDS = 5 * 60;

const mac = (secret: string, t: number, body: string) => createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

export function signPayload(body: string, secret: string, now = Date.now()) {
  const t = Math.floor(now / 1000);
  return `t=${t},v1=${mac(secret, t, body)}`;
}

export type SignatureCheck = { ok: true } | { ok: false; error: "missing" | "malformed" | "expired" | "mismatch" };

export function verifySignature(body: string, header: string | null, secret: string, now = Date.now()): SignatureCheck {
  if (!header) return { ok: false, error: "missing" };
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isInteger(t) || !v1 || !/^[0-9a-f]{64}$/.test(v1)) return { ok: false, error: "malformed" };
  if (Math.abs(now / 1000 - t) > TOLERANCE_SECONDS) return { ok: false, error: "expired" };
  const expected = Buffer.from(mac(secret, t, body), "hex");
  const given = Buffer.from(v1, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given) ? { ok: true } : { ok: false, error: "mismatch" };
}
