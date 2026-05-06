import CryptoJS from 'crypto-js';

// In a real E2EE app, keys would be generated per chat and synced securely.
// For this demo, we use a consistent "chat key" pattern.
const APP_SECRET = 'x-sphere-secret-key-123';

export const encryptMessage = (text: string, chatId: string) => {
  return CryptoJS.AES.encrypt(text, `${APP_SECRET}-${chatId}`).toString();
};

export const decryptMessage = (encryptedText: string, chatId: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, `${APP_SECRET}-${chatId}`);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return "[Encrypted Message]";
  }
};
