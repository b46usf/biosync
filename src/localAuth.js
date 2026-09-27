const ACCOUNT_KEY = "biosync-demo-account";
const ACCOUNT_VERSION = 1;
const DERIVATION_ITERATIONS = 310_000;
const VERIFY_MESSAGE = new TextEncoder().encode("BioSync local account verifier v1");

const bytesToBase64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));
const base64ToBytes = (value) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  return /^[a-z0-9._-]{3,24}$/.test(username);
}

export function readLocalAccount() {
  try {
    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
    return account?.version === ACCOUNT_VERSION ? account : null;
  } catch {
    return null;
  }
}

export function hasLocalAccount() {
  return Boolean(readLocalAccount());
}

async function deriveVerifierKey(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: DERIVATION_ITERATIONS,
    },
    material,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}

export async function createLocalAccount(usernameValue, password) {
  const username = normalizeUsername(usernameValue);
  if (!validateUsername(username)) throw new Error("USERNAME_INVALID");
  if (readLocalAccount()) throw new Error("ACCOUNT_EXISTS");

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVerifierKey(password, salt);
  const verifier = await crypto.subtle.sign("HMAC", key, VERIFY_MESSAGE);
  const account = {
    version: ACCOUNT_VERSION,
    username,
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
  };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return account;
}

export async function verifyLocalAccount(usernameValue, password) {
  const account = readLocalAccount();
  if (!account || account.username !== normalizeUsername(usernameValue))
    return false;
  try {
    const key = await deriveVerifierKey(password, base64ToBytes(account.salt));
    return crypto.subtle.verify(
      "HMAC",
      key,
      base64ToBytes(account.verifier),
      VERIFY_MESSAGE,
    );
  } catch {
    return false;
  }
}

export function deleteLocalAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
}
