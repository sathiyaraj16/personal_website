// ==============================================================================
// NEXA Enterprise Productivity Workspace - Secure Locker Cryptographic Engine
// Zero-Trust Envelope Encryption Architecture (AES-256-GCM + PBKDF2-SHA512 + Argon2id)
// ==============================================================================

import { argon2id } from 'hash-wasm';
import { FileValidationResult } from '../../types/locker';

// NIST & OWASP Cryptographic Constants
export const CRYPTO_CONSTANTS = {
  ARGON2_MEMORY_KB: 19456, // 19 MB
  ARGON2_ITERATIONS: 3,
  ARGON2_PARALLELISM: 1,
  ARGON2_HASH_LENGTH: 32, // 256 bits

  PBKDF2_ITERATIONS: 600000, // OWASP 2023+ recommendation for HMAC-SHA512
  AES_KEY_LENGTH_BITS: 256,
  GCM_NONCE_LENGTH_BYTES: 12, // 96 bits standard for AES-GCM
  SALT_LENGTH_BYTES: 32, // 256 bits
  MAX_FILE_SIZE_BYTES: 52428800, // 50 MB
};

// Byte <-> Hex / Base64 Helpers
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal string length.');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a 12-byte unique AES-GCM nonce (IV)
 */
export function generateNonce(): Uint8Array {
  return generateRandomBytes(CRYPTO_CONSTANTS.GCM_NONCE_LENGTH_BYTES);
}

/**
 * Generate a 32-byte cryptographically secure salt
 */
export function generateSalt(): Uint8Array {
  return generateRandomBytes(CRYPTO_CONSTANTS.SALT_LENGTH_BYTES);
}

/**
 * Evaluate passphrase strength and entropy
 */
export function evaluatePassphraseStrength(passphrase: string): {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (passphrase.length < 10) {
    feedback.push('Must be at least 10 characters long.');
  } else if (passphrase.length >= 14) {
    score += 1;
  }

  if (/[A-Z]/.test(passphrase)) score += 1;
  else feedback.push('Include at least one uppercase letter (A-Z).');

  if (/[a-z]/.test(passphrase)) score += 1;
  else feedback.push('Include at least one lowercase letter (a-z).');

  if (/[0-9]/.test(passphrase)) score += 1;
  else feedback.push('Include at least one digit (0-9).');

  if (/[^A-Za-z0-9]/.test(passphrase)) score += 1;
  else feedback.push('Include at least one special character (!@#$%^&*...).');

  const isValid = passphrase.length >= 10 && score >= 4 && feedback.length === 0;

  return { isValid, score, feedback };
}

/**
 * 1. Compute Argon2id Locker Authentication Verifier Hash.
 * This hash is verified against the backend verifier without revealing the passphrase.
 */
export async function deriveAuthVerifier(passphrase: string, authSalt: Uint8Array): Promise<string> {
  const hash = await argon2id({
    password: passphrase,
    salt: authSalt,
    parallelism: CRYPTO_CONSTANTS.ARGON2_PARALLELISM,
    iterations: CRYPTO_CONSTANTS.ARGON2_ITERATIONS,
    memorySize: CRYPTO_CONSTANTS.ARGON2_MEMORY_KB,
    hashLength: CRYPTO_CONSTANTS.ARGON2_HASH_LENGTH,
    outputType: 'hex',
  });
  return hash;
}

/**
 * Compute single-use HMAC-SHA256 proof of passphrase verifier for zero-knowledge challenge-response.
 * Prevents verifier exposure, offline dictionary attacks, and replay attacks.
 */
export async function computeAuthProof(authVerifier: string, challengeNonce: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(authVerifier);
  const dataBytes = enc.encode(challengeNonce);

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
  return bytesToHex(new Uint8Array(signature));
}

/**
 * 2. Derive Key-Encryption Key (KEK) using Web Crypto PBKDF2-HMAC-SHA512.
 * 600,000 rounds of SHA-512 ensures high brute-force resistance.
 * The derived KEK NEVER leaves client memory and is NEVER sent to the server.
 */
export async function deriveKeyEncryptionKey(passphrase: string, kekSalt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const kek = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: kekSalt as BufferSource,
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
      hash: 'SHA-512',
    },
    passphraseKey,
    { name: 'AES-GCM', length: CRYPTO_CONSTANTS.AES_KEY_LENGTH_BITS },
    false, // extractable = false to prevent key leakage from client memory
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );

  return kek;
}

/**
 * Derive raw 256-bit Key-Encryption Key bytes using Web Crypto PBKDF2-HMAC-SHA512.
 * Used internally for zero-knowledge recovery wrapping under recoveryKek.
 */
export async function deriveRawKeyEncryptionKeyBytes(passphrase: string, kekSalt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const rawBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: kekSalt as BufferSource,
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
      hash: 'SHA-512',
    },
    passphraseKey,
    CRYPTO_CONSTANTS.AES_KEY_LENGTH_BITS
  );

  return new Uint8Array(rawBits);
}

/**
 * Wrap raw master KEK bytes under Recovery KEK with AES-256-GCM and AAD.
 */
export async function wrapMasterKekUnderRecoveryKek(
  rawKekBytes: Uint8Array,
  recoveryKek: CryptoKey,
  aadContext: string
): Promise<{ encryptedMasterRecoveryKeyBase64: string; recoveryNonceHex: string }> {
  const nonce = generateNonce();
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    recoveryKek,
    rawKekBytes as BufferSource
  );

  return {
    encryptedMasterRecoveryKeyBase64: bytesToBase64(new Uint8Array(encryptedBuffer)),
    recoveryNonceHex: bytesToHex(nonce),
  };
}

/**
 * Unwrap raw master KEK bytes under Recovery KEK with AES-256-GCM and AAD,
 * and import into a non-extractable CryptoKey.
 */
export async function unwrapMasterKekUnderRecoveryKek(
  encryptedBase64: string,
  nonceHex: string,
  recoveryKek: CryptoKey,
  aadContext: string
): Promise<CryptoKey> {
  const encryptedBytes = base64ToBytes(encryptedBase64);
  const nonce = hexToBytes(nonceHex);
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const decryptedRawBytes = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    recoveryKek,
    encryptedBytes as BufferSource
  );

  return crypto.subtle.importKey(
    'raw',
    decryptedRawBytes,
    { name: 'AES-GCM', length: CRYPTO_CONSTANTS.AES_KEY_LENGTH_BITS },
    false, // extractable = false to ensure zero key leakage from RAM
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

/**
 * 3. Generate a 256-bit Recovery Key and derive Recovery KEK
 */
export function generateRecoveryKeyString(): string {
  // 32 chars of high entropy (base32-like clean charset: A-Z, 2-9, excluding ambiguous 0, O, 1, I)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = generateRandomBytes(32);
  let raw = '';
  for (let i = 0; i < 32; i++) {
    raw += charset[randomBytes[i] % charset.length];
  }
  // Format as 8 groups of 4: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;
  return formatted;
}

export function normalizeRecoveryKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z2-9]/g, '');
}

/**
 * Derive Recovery Verifier using Argon2id
 */
export async function deriveRecoveryVerifier(normalizedKey: string, recoverySalt: Uint8Array): Promise<string> {
  return deriveAuthVerifier(`REC:${normalizedKey}`, recoverySalt);
}

/**
 * Derive Recovery KEK using PBKDF2-SHA512
 */
export async function deriveRecoveryKeyEncryptionKey(normalizedKey: string, recoverySalt: Uint8Array): Promise<CryptoKey> {
  return deriveKeyEncryptionKey(`REC:${normalizedKey}`, recoverySalt);
}

/**
 * 4. Generate a unique Data Encryption Key (DEK) for each document/secret.
 */
export async function generateDataEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: CRYPTO_CONSTANTS.AES_KEY_LENGTH_BITS },
    true, // extractable for wrapping under KEK
    ['encrypt', 'decrypt']
  );
}

/**
 * Wrap (encrypt) DEK with KEK using AES-256-GCM and Authenticated Additional Data (AAD)
 */
export async function wrapDekWithKek(
  dek: CryptoKey,
  kek: CryptoKey,
  aadContext: string
): Promise<{ encryptedDekBase64: string; dekNonceHex: string }> {
  const dekNonce = generateNonce();
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const encryptedDekBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: dekNonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    kek,
    rawDek
  );

  return {
    encryptedDekBase64: bytesToBase64(new Uint8Array(encryptedDekBuffer)),
    dekNonceHex: bytesToHex(dekNonce),
  };
}

/**
 * Unwrap (decrypt) DEK with KEK using AES-256-GCM and verify Authenticated Additional Data (AAD)
 */
export async function unwrapDekWithKek(
  encryptedDekBase64: string,
  dekNonceHex: string,
  kek: CryptoKey,
  aadContext: string
): Promise<CryptoKey> {
  const encryptedDekBytes = base64ToBytes(encryptedDekBase64);
  const dekNonce = hexToBytes(dekNonceHex);
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const decryptedRawDek = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: dekNonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    kek,
    encryptedDekBytes as BufferSource
  );

  return crypto.subtle.importKey(
    'raw',
    decryptedRawDek,
    { name: 'AES-GCM', length: CRYPTO_CONSTANTS.AES_KEY_LENGTH_BITS },
    true, // extractable so it can be re-wrapped under new KEK during key rotation
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

/**
 * 5. Encrypt document/data with DEK using AES-256-GCM
 */
export async function encryptDataWithDek(
  data: ArrayBuffer | Uint8Array,
  dek: CryptoKey,
  aadContext: string
): Promise<{ encryptedData: Uint8Array; dataNonceHex: string; checksumSha256Hex: string }> {
  const dataNonce = generateNonce();
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const inputBuffer = data instanceof Uint8Array ? data : new Uint8Array(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: dataNonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    dek,
    inputBuffer as BufferSource
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const checksum = await computeSha256(encryptedBytes);

  return {
    encryptedData: encryptedBytes,
    dataNonceHex: bytesToHex(dataNonce),
    checksumSha256Hex: checksum,
  };
}

/**
 * 6. Decrypt document/data with DEK using AES-256-GCM
 */
export async function decryptDataWithDek(
  encryptedData: ArrayBuffer | Uint8Array,
  dek: CryptoKey,
  dataNonceHex: string,
  aadContext: string,
  expectedChecksum?: string
): Promise<Uint8Array> {
  const encryptedBytes = encryptedData instanceof Uint8Array ? encryptedData : new Uint8Array(encryptedData);

  // Verify checksum if provided
  if (expectedChecksum) {
    const actualChecksum = await computeSha256(encryptedBytes);
    if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
      throw new Error('Integrity verification failed: SHA-256 checksum mismatch.');
    }
  }

  const dataNonce = hexToBytes(dataNonceHex);
  const enc = new TextEncoder();
  const aad = enc.encode(aadContext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: dataNonce as BufferSource,
      additionalData: aad as BufferSource,
    },
    dek,
    encryptedBytes as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Compute SHA-256 Checksum in Hex
 */
export async function computeSha256(data: Uint8Array): Promise<string> {
  const digestBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return bytesToHex(new Uint8Array(digestBuffer));
}

/**
 * 7. Validate File Signature (Magic Bytes) and Size
 */
export function validateFileSignatureAndSize(fileBytes: Uint8Array, declaredMimeType: string): FileValidationResult {
  if (fileBytes.byteLength === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (fileBytes.byteLength > CRYPTO_CONSTANTS.MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum allowed size of 50 MB.` };
  }

  // Check magic signatures
  const header4 = bytesToHex(fileBytes.slice(0, 4)).toUpperCase();
  const header8 = bytesToHex(fileBytes.slice(0, 8)).toUpperCase();

  // PDF check: %PDF (25 50 44 46)
  if (header4 === '25504446') {
    return { valid: true, detectedMime: 'application/pdf' };
  }

  // PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (header8.startsWith('89504E470D0A1A0A')) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // JPEG check: FF D8 FF
  if (header4.startsWith('FFD8FF')) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // WebP check: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (header4 === '52494646') {
    const riffType = bytesToHex(fileBytes.slice(8, 12)).toUpperCase();
    if (riffType === '57454250') {
      return { valid: true, detectedMime: 'image/webp' };
    }
  }

  // Zip/DOCX check: 50 4B 03 04 (PK..)
  if (header4 === '504B0304') {
    return { valid: true, detectedMime: 'application/zip' };
  }

  // Text / JSON / Markdown validation: Check valid UTF-8 and no dangerous executable binaries
  if (
    declaredMimeType.startsWith('text/') ||
    declaredMimeType.includes('json') ||
    declaredMimeType.includes('javascript') ||
    declaredMimeType.includes('csv')
  ) {
    // Check for null bytes which indicate binary executable
    for (let i = 0; i < Math.min(fileBytes.byteLength, 1024); i++) {
      if (fileBytes[i] === 0) {
        return { valid: false, error: 'File contains binary null bytes but was declared as text.' };
      }
    }
    return { valid: true, detectedMime: declaredMimeType };
  }

  // Default fallback for generic binary attachments
  return { valid: true, detectedMime: declaredMimeType || 'application/octet-stream' };
}
