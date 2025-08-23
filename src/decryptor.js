import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const rawKey = String(process.env.PASSWORD_ENCRYPTION_KEY) || 'my_very_secure_fallback_key';
const encryptionKey = crypto.createHash('sha256').update(rawKey).digest();

function decrypt(encrypted) {
  try {
    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted format. Expected "iv:encrypted"');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.error('❌ Decryption failed:', err.message);
    return null;
  }
}

// Test
const encryptedString = 'c1b5004c4eedc415c220681707baaffa:2d5bded4904a2720584c8a86b4299a77';
const decrypted = decrypt(encryptedString);
console.log('Key type:', typeof encryptionKey); // Should be 'object'
console.log('Key length:', encryptionKey.length); // Should be 32
console.log('🔓 Decrypted password:', decrypted);