/**
 * AES-256-GCM encryption and decryption utilities for API tokens.
 *
 * This module is server-side only. It uses `process.env.TOKEN_ENCRYPTION_KEY`
 * to retrieve the encryption key. If the environment variable is not set,
 * a temporary key is generated at startup (with a warning logged to console).
 *
 * Encrypted output format: `iv:authTag:ciphertext` (all hex-encoded, colon-separated).
 *
 * @module encryption
 */

import * as crypto from 'crypto';

/** Algorithm used for encryption and decryption */
const ALGORITHM = 'aes-256-gcm';

/** Length of the initialization vector in bytes (96 bits / 12 bytes is recommended for GCM) */
const IV_LENGTH = 12;

/** Length of the authentication tag in bytes (128 bits) */
const AUTH_TAG_LENGTH = 16;

/** Required key length in bytes (256 bits) */
const KEY_LENGTH = 32;

/**
 * Resolve the encryption key from the environment variable.
 *
 * - If `TOKEN_ENCRYPTION_KEY` is a 64-character hex string, it is decoded to a 32-byte Buffer.
 * - If the value is shorter than 32 bytes when decoded, it is hashed with SHA-256 to derive a key.
 * - If the environment variable is not set, a random key is generated and a warning is logged.
 *
 * @returns 32-byte Buffer containing the encryption key
 */
function resolveEncryptionKey(): Buffer {
	const envKey = process.env.TOKEN_ENCRYPTION_KEY;

	if (envKey && envKey.length > 0) {
		// Check if it looks like a hex string (64 hex chars = 32 bytes)
		if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
			return Buffer.from(envKey, 'hex');
		}

		// Try to use the raw bytes; if shorter than 32 bytes, derive with SHA-256
		const rawBuffer = Buffer.from(envKey, 'utf-8');
		if (rawBuffer.length >= KEY_LENGTH) {
			// Use first 32 bytes
			return rawBuffer.subarray(0, KEY_LENGTH);
		}

		// Derive a 32-byte key via SHA-256
		return crypto.createHash('sha256').update(rawBuffer).digest();
	}

	// No key configured — generate a random one for development convenience
	const generatedKey = crypto.randomBytes(KEY_LENGTH);
	console.warn(
		'[encryption] WARNING: TOKEN_ENCRYPTION_KEY is not set. ' +
			'A random key has been generated for this session. ' +
			'Encrypted tokens will NOT be recoverable after a restart. ' +
			'Set TOKEN_ENCRYPTION_KEY in your environment for production use.'
	);
	return generatedKey;
}

/** The resolved encryption key (32 bytes), initialised once at module load */
const encryptionKey: Buffer = resolveEncryptionKey();

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The plain text string to encrypt (e.g. an API token)
 * @returns A colon-separated string in the format `iv:authTag:ciphertext`, all hex-encoded
 *
 * @example
 * ```ts
 * const encrypted = encrypt('my-secret-token');
 * // → "a1b2c3d4e5f6...:789abc1234...:def012345..."
 * ```
 */
export function encrypt(plaintext: string): string {
	// Generate a random initialization vector
	const iv = crypto.randomBytes(IV_LENGTH);

	// Create cipher with GCM mode
	const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});

	// Encrypt the plaintext
	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf-8'),
		cipher.final(),
	]);

	// Get the authentication tag
	const authTag = cipher.getAuthTag();

	// Return as colon-separated hex values
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string that was encrypted with the {@link encrypt} function.
 *
 * @param encoded - The encrypted string in `iv:authTag:ciphertext` format (hex-encoded)
 * @returns The original plaintext string
 * @throws {Error} If the input format is invalid or decryption fails
 *
 * @example
 * ```ts
 * const encrypted = encrypt('my-secret-token');
 * const decrypted = decrypt(encrypted);
 * // → "my-secret-token"
 * ```
 */
export function decrypt(encoded: string): string {
	const parts = encoded.split(':');

	if (parts.length !== 3) {
		throw new Error(
			'Invalid encrypted format. Expected `iv:authTag:ciphertext` (3 colon-separated hex values).'
		);
	}

	const [ivHex, authTagHex, ciphertextHex] = parts;

	// Validate that all parts are non-empty hex strings
	if (!ivHex || !authTagHex || !ciphertextHex) {
		throw new Error(
			'Invalid encrypted format. All three parts (iv, authTag, ciphertext) must be non-empty hex strings.'
		);
	}

	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const ciphertext = Buffer.from(ciphertextHex, 'hex');

	// Create decipher
	const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});

	// Set the authentication tag
	decipher.setAuthTag(authTag);

	try {
		// Decrypt and return plaintext
		const decrypted = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]);

		return decrypted.toString('utf-8');
	} catch (error) {
		throw new Error(
			`Decryption failed. The data may be corrupted or the encryption key has changed. ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
