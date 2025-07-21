// src/lib/encryption.ts
import CryptoJS from 'crypto-js';
import type { EncryptedData } from './types';

// Generate a user-specific encryption key based on their auth data
export function generateEncryptionKey(userId: string, userEmail: string): string {
  // In production, you'd want to use more secure key derivation
  const combined = `${userId}-${userEmail}-${process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'moneysimp-default-salt'}`;
  return CryptoJS.SHA256(combined).toString();
}

export function encryptData(data: any, encryptionKey: string): EncryptedData {
  try {
    const jsonString = JSON.stringify(data);
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      data: encrypted.toString(),
      iv: iv.toString(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData<T>(encryptedData: EncryptedData, encryptionKey: string): T {
  try {
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption returned empty string - invalid key or corrupted data');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

// Secure storage wrapper that automatically encrypts/decrypts
export class SecureStorage {
  private encryptionKey: string;

  constructor(userId: string, userEmail: string) {
    this.encryptionKey = generateEncryptionKey(userId, userEmail);
  }

  setItem(key: string, value: any): void {
    try {
      const encrypted = encryptData(value, this.encryptionKey);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Secure storage setItem failed:', error);
      throw error;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const storedData = localStorage.getItem(key);
      if (!storedData) return null;

      const encryptedData: EncryptedData = JSON.parse(storedData);
      return decryptData<T>(encryptedData, this.encryptionKey);
    } catch (error) {
      console.error('Secure storage getItem failed:', error);
      // Return null instead of throwing to handle corrupted data gracefully
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    // Only clear MoneySimp-related keys to avoid affecting other apps
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('moneySimp-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Utility to check if data is potentially sensitive
export function isSensitiveData(data: any): boolean {
  const sensitiveKeys = [
    'account', 'balance', 'transaction', 'bank', 'plaid', 
    'routing', 'number', 'ssn', 'tax', 'income'
  ];
  
  const dataString = JSON.stringify(data).toLowerCase();
  return sensitiveKeys.some(key => dataString.includes(key));
}

// Data sanitization for logs
export function sanitizeForLog(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = ['accountId', 'plaidTransactionId', 'mask', 'balance', 'amount', 'accessToken'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}
