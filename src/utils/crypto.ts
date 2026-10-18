import { EncryptedPayload } from '../types';

/**
 * Client-Side End-to-End Encryption (E2EE) Utility
 * Uses Web Crypto API:
 * - PBKDF2 with 100,000 iterations for key derivation
 * - AES-GCM 256-bit for authenticated encryption
 * - SHA-256 for secure PIN hashing
 */

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compute SHA-256 hash of a string with optional salt
export async function sha256(text: string, salt: string = ''): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

// Generate random salt
export function generateSalt(length = 16): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  return bufferToBase64(randomBytes);
}

// Derive AES-GCM 256 key from a passphrase/PIN using PBKDF2
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt any JavaScript object/data using passphrase
export async function encryptData<T>(data: T, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const encodedData = enc.encode(jsonString);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  const hash = await sha256(jsonString);

  return {
    v: 1,
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    ciphertext: bufferToBase64(ciphertext),
    hash,
  };
}

// Decrypt encrypted payload using passphrase
export async function decryptData<T>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}
