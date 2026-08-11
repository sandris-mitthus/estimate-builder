import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "enc:v1:";

function encryptionSecret(): string | null {
  const fromDedicated =
    process.env.SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.RESEND_SECRETS_ENCRYPTION_KEY?.trim();
  if (fromDedicated) return fromDedicated;
  // Dev fallback only — never use service role as production secret material preference.
  if (process.env.NODE_ENV !== "production") {
    return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  }
  return null;
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, "estimate-builder-secrets-v1", 32);
}

/** Encrypt a secret for DB storage. Returns plaintext unchanged if no key (caller should prefer env). */
export function encryptSecretForStorage(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(PREFIX)) return trimmed;

  const secret = encryptionSecret();
  if (!secret) {
    return trimmed;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecretFromStorage(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith(PREFIX)) {
    return trimmed;
  }

  const secret = encryptionSecret();
  if (!secret) {
    console.error(
      "[secrets] Encrypted value present but SECRETS_ENCRYPTION_KEY is missing.",
    );
    return "";
  }

  try {
    const payload = trimmed.slice(PREFIX.length);
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return "";

    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch (error) {
    console.error("[secrets] Failed to decrypt stored secret.", error);
    return "";
  }
}

export function canEncryptSecrets(): boolean {
  return Boolean(encryptionSecret());
}
