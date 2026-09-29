import Hash from 'ipfs-only-hash';
import { ethers } from 'ethers';

// Convert string/password to CryptoKey
export async function getCryptoKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("satbara-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
}

// Deterministic IV based on file content so the same file + password = same encrypted output
export async function computeFileHash(fileBuffer) {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileBuffer);
  return new Uint8Array(hashBuffer);
}

export async function encryptFile(fileBuffer, password) {
  const key = await getCryptoKey(password);
  const fileHash = await computeFileHash(fileBuffer);
  const iv = fileHash.slice(0, 12); // Use first 12 bytes of file hash as deterministic IV
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv }, key, fileBuffer
  );
  
  // Prepend IV to encrypted data for decryption later
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return result;
}

export async function decryptFile(encryptedBuffer, password) {
  const key = await getCryptoKey(password);
  const iv = encryptedBuffer.slice(0, 12);
  const data = encryptedBuffer.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv }, key, data
  );
  return new Uint8Array(decrypted);
}

export async function getIpfsCid(buffer) {
  // Returns the IPFS CID (v0) of the buffer exactly as Pinata would
  const cid = await Hash.of(buffer);
  return cid;
}

export function generateSaltedHash(text, salt) {
    return ethers.keccak256(ethers.toUtf8Bytes(text + salt));
}
