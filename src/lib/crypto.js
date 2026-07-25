import CryptoJS from 'crypto-js';

/**
 * Encrypts a string using AES-256 with the provided master password.
 * @param {string} plaintext - The plain text to encrypt.
 * @param {string} masterPassword - The master password used as the encryption key.
 * @returns {string} The encrypted ciphertext as a string.
 */
export function encryptData(plaintext, masterPassword) {
  if (!plaintext) return '';
  try {
    return CryptoJS.AES.encrypt(plaintext, masterPassword).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a ciphertext string using AES-256 with the provided master password.
 * @param {string} ciphertext - The encrypted text to decrypt.
 * @param {string} masterPassword - The master password used as the decryption key.
 * @returns {string} The decrypted plain text.
 */
export function decryptData(ciphertext, masterPassword) {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, masterPassword);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string (likely wrong key)');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Wrong Master Password or corrupted data.');
  }
}
