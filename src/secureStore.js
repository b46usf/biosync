const VAULT_KEY = "biosync-demo-vault";
const LEGACY_KEY = "biosync-demo";
const VERSION = 1;
const ITERATIONS = 310_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}
const base64ToBytes = (value) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

async function deriveKeys(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      material,
      512,
    ),
  );
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    bits.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  const authenticationKey = await crypto.subtle.importKey(
    "raw",
    bits.slice(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  bits.fill(0);
  return { encryptionKey, authenticationKey };
}

const authenticatedValue = (record) =>
  `${record.version}.${record.iterations}.${record.salt}.${record.iv}.${record.ciphertext}`;

export function hasEncryptedVault() {
  return Boolean(localStorage.getItem(VAULT_KEY));
}

export function hasLegacyState() {
  return Boolean(localStorage.getItem(LEGACY_KEY));
}

export async function createEncryptedVault(password, data) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keys = await deriveKeys(password, salt);
  const record = {
    version: VERSION,
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  };
  record.ciphertext = bytesToBase64(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keys.encryptionKey,
      encoder.encode(JSON.stringify(data)),
    ),
  );
  record.hmac = bytesToBase64(
    await crypto.subtle.sign(
      "HMAC",
      keys.authenticationKey,
      encoder.encode(authenticatedValue(record)),
    ),
  );
  localStorage.setItem(VAULT_KEY, JSON.stringify(record));
  localStorage.removeItem(LEGACY_KEY);
  return keys;
}

export async function unlockEncryptedVault(password) {
  const record = JSON.parse(localStorage.getItem(VAULT_KEY) || "null");
  if (!record || record.version !== VERSION || record.iterations !== ITERATIONS)
    throw new Error("FORMAT");
  const salt = base64ToBytes(record.salt);
  const iv = base64ToBytes(record.iv);
  const keys = await deriveKeys(password, salt);
  const valid = await crypto.subtle.verify(
    "HMAC",
    keys.authenticationKey,
    base64ToBytes(record.hmac),
    encoder.encode(authenticatedValue(record)),
  );
  if (!valid) throw new Error("AUTH");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keys.encryptionKey,
    base64ToBytes(record.ciphertext),
  );
  return { data: JSON.parse(decoder.decode(plaintext)), keys };
}

export async function saveEncryptedVault(keys, data) {
  const previous = JSON.parse(localStorage.getItem(VAULT_KEY) || "null");
  if (!previous || previous.version !== VERSION)
    throw new Error("VAULT_MISSING");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const record = {
    version: VERSION,
    iterations: ITERATIONS,
    salt: previous.salt,
    iv: bytesToBase64(iv),
  };
  record.ciphertext = bytesToBase64(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keys.encryptionKey,
      encoder.encode(JSON.stringify(data)),
    ),
  );
  record.hmac = bytesToBase64(
    await crypto.subtle.sign(
      "HMAC",
      keys.authenticationKey,
      encoder.encode(authenticatedValue(record)),
    ),
  );
  localStorage.setItem(VAULT_KEY, JSON.stringify(record));
}

export function readLegacyState() {
  return JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}");
}

export function deleteEncryptedVault() {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
