import { describe, it, expect } from 'vitest';
import {
  evaluatePassphraseStrength,
  deriveAuthVerifier,
  deriveKeyEncryptionKey,
  generateRecoveryKeyString,
  normalizeRecoveryKey,
  deriveRecoveryVerifier,
  deriveRecoveryKeyEncryptionKey,
  generateDataEncryptionKey,
  wrapDekWithKek,
  unwrapDekWithKek,
  encryptDataWithDek,
  decryptDataWithDek,
  generateNonce,
  generateSalt,
  validateFileSignatureAndSize,
  bytesToHex,
  hexToBytes,
} from '../services/crypto/lockerCrypto';

describe('Secure Locker Cryptographic Engine Tests', () => {
  const strongPassphrase = 'NexaSecureLocker#2026!StrongPass';
  const weakPassphrase = 'pass';
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testDocId = 'doc-12345';

  it('evaluates passphrase strength accurately', () => {
    const weakEval = evaluatePassphraseStrength(weakPassphrase);
    expect(weakEval.isValid).toBe(false);
    expect(weakEval.feedback.length).toBeGreaterThan(0);

    const strongEval = evaluatePassphraseStrength(strongPassphrase);
    expect(strongEval.isValid).toBe(true);
    expect(strongEval.score).toBeGreaterThanOrEqual(4);
    expect(strongEval.feedback.length).toBe(0);
  });

  it('computes distinct Argon2id verifiers for different salts and passwords', async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    const verifier1 = await deriveAuthVerifier(strongPassphrase, salt1);
    const verifier2 = await deriveAuthVerifier(strongPassphrase, salt2);
    const verifier3 = await deriveAuthVerifier('DifferentPass#2026!Strong', salt1);

    expect(verifier1).toHaveLength(64); // 32 bytes in hex
    expect(verifier2).toHaveLength(64);
    expect(verifier1).not.toBe(verifier2);
    expect(verifier1).not.toBe(verifier3);
  });

  it('derives independent KEK from passphrase and salt', async () => {
    const kekSalt = generateSalt();
    const kek = await deriveKeyEncryptionKey(strongPassphrase, kekSalt);
    expect(kek).toBeDefined();
    expect(kek.algorithm.name).toBe('AES-GCM');
    expect(kek.extractable).toBe(false); // KEK must NOT be extractable from RAM
  });

  it('handles recovery key generation, formatting and KEK derivation', async () => {
    const recoveryKey = generateRecoveryKeyString();
    expect(recoveryKey).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){7}$/);

    const normalized = normalizeRecoveryKey(recoveryKey);
    expect(normalized).toHaveLength(32);

    const recoverySalt = generateSalt();
    const verifier = await deriveRecoveryVerifier(normalized, recoverySalt);
    expect(verifier).toHaveLength(64);

    const recoveryKek = await deriveRecoveryKeyEncryptionKey(normalized, recoverySalt);
    expect(recoveryKek.algorithm.name).toBe('AES-GCM');
  });

  it('performs envelope encryption: wraps and unwraps DEK with KEK and AAD context', async () => {
    const kekSalt = generateSalt();
    const kek = await deriveKeyEncryptionKey(strongPassphrase, kekSalt);
    const dek = await generateDataEncryptionKey();

    const aad = `${testUserId}:${testDocId}:dek`;
    const wrapped = await wrapDekWithKek(dek, kek, aad);

    expect(wrapped.encryptedDekBase64).toBeDefined();
    expect(wrapped.dekNonceHex).toHaveLength(24); // 12 bytes = 24 hex

    const unwrappedDek = await unwrapDekWithKek(
      wrapped.encryptedDekBase64,
      wrapped.dekNonceHex,
      kek,
      aad
    );

    expect(unwrappedDek).toBeDefined();
    expect(unwrappedDek.algorithm.name).toBe('AES-GCM');
  });

  it('fails to unwrap DEK if AAD context or ciphertext is tampered', async () => {
    const kekSalt = generateSalt();
    const kek = await deriveKeyEncryptionKey(strongPassphrase, kekSalt);
    const dek = await generateDataEncryptionKey();

    const aadCorrect = `${testUserId}:${testDocId}:dek`;
    const aadTampered = `attacker-user-id:${testDocId}:dek`;

    const wrapped = await wrapDekWithKek(dek, kek, aadCorrect);

    // Tampered AAD
    await expect(
      unwrapDekWithKek(wrapped.encryptedDekBase64, wrapped.dekNonceHex, kek, aadTampered)
    ).rejects.toThrow();

    // Tampered Ciphertext
    const rawBytes = hexToBytes(bytesToHex(new Uint8Array([1, 2, 3, 4, 5])));
    const corruptedBase64 = btoa(String.fromCharCode(...rawBytes));
    await expect(
      unwrapDekWithKek(corruptedBase64, wrapped.dekNonceHex, kek, aadCorrect)
    ).rejects.toThrow();
  });

  it('performs roundtrip AES-256-GCM data encryption and decryption', async () => {
    const dek = await generateDataEncryptionKey();
    const rawText = 'Confidential NEXA Financial Vault Payload - Classified 2026';
    const textBytes = new TextEncoder().encode(rawText);
    const aad = `${testUserId}:${testDocId}:content`;

    const encrypted = await encryptDataWithDek(textBytes, dek, aad);
    expect(encrypted.encryptedData.length).toBeGreaterThan(textBytes.length); // includes 16-byte GCM tag
    expect(encrypted.dataNonceHex).toHaveLength(24);
    expect(encrypted.checksumSha256Hex).toHaveLength(64);

    const decryptedBytes = await decryptDataWithDek(
      encrypted.encryptedData,
      dek,
      encrypted.dataNonceHex,
      aad,
      encrypted.checksumSha256Hex
    );

    const decryptedText = new TextDecoder().decode(decryptedBytes);
    expect(decryptedText).toBe(rawText);
  });

  it('detects tampered ciphertext and rejects decryption via GCM authentication tag', async () => {
    const dek = await generateDataEncryptionKey();
    const textBytes = new TextEncoder().encode('Sensitive Payload');
    const aad = `${testUserId}:${testDocId}:content`;

    const encrypted = await encryptDataWithDek(textBytes, dek, aad);
    const tamperedPayload = new Uint8Array(encrypted.encryptedData);
    // Flip 1 bit in the ciphertext
    tamperedPayload[0] ^= 0x01;

    // Must fail decryption
    await expect(
      decryptDataWithDek(tamperedPayload, dek, encrypted.dataNonceHex, aad)
    ).rejects.toThrow();
  });

  it('guarantees unique nonces across 1,000 iterations', () => {
    const set = new Set<string>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const nonceHex = bytesToHex(generateNonce());
      set.add(nonceHex);
    }
    expect(set.size).toBe(count);
  });

  it('validates file magic bytes accurately', () => {
    // Valid PDF (%PDF-)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const pdfRes = validateFileSignatureAndSize(pdfBytes, 'application/pdf');
    expect(pdfRes.valid).toBe(true);
    expect(pdfRes.detectedMime).toBe('application/pdf');

    // Valid PNG (89 50 4E 47 0D 0A 1A 0A)
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const pngRes = validateFileSignatureAndSize(pngBytes, 'image/png');
    expect(pngRes.valid).toBe(true);
    expect(pngRes.detectedMime).toBe('image/png');

    // Executable disguised as text (contains null byte)
    const badTextBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x00, 0x6f]); // 'Hel\0o'
    const textRes = validateFileSignatureAndSize(badTextBytes, 'text/plain');
    expect(textRes.valid).toBe(false);
    expect(textRes.error).toContain('null bytes');
  });
});
