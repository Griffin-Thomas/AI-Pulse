use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::Rng;
use std::env;

/// Fixed app-specific salt for key derivation
const APP_SALT: &[u8] = b"ai-pulse-credential-encryption-v1";

/// Derives a 256-bit encryption key from machine-specific info
/// This provides encryption at rest without requiring user interaction
fn derive_key() -> [u8; 32] {
    // Combine multiple sources for key material:
    // 1. App-specific salt
    // 2. Username (machine-specific)
    // 3. Home directory (machine-specific)
    let username = env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| "default-user".to_string());

    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_else(|_| "/unknown".to_string());

    // Simple key derivation using repeated hashing
    // For production, consider using a proper KDF like PBKDF2 or Argon2
    let mut key_material = Vec::new();
    key_material.extend_from_slice(APP_SALT);
    key_material.extend_from_slice(username.as_bytes());
    key_material.extend_from_slice(home.as_bytes());

    // Use a simple hash-based key derivation
    // We'll hash the material multiple times to stretch it
    let mut key = [0u8; 32];
    let mut hasher_input = key_material.clone();

    for i in 0..1000 {
        // Simple mixing: combine previous result with iteration number
        hasher_input.push((i & 0xFF) as u8);

        // XOR-fold the input into 32 bytes
        let mut folded = [0u8; 32];
        for (j, byte) in hasher_input.iter().enumerate() {
            folded[j % 32] ^= byte;
        }

        // Mix with previous key
        for (k, f) in key.iter_mut().zip(folded.iter()) {
            *k = k.wrapping_add(*f);
        }

        hasher_input = key.to_vec();
    }

    key
}

/// Encrypts a string value using AES-256-GCM
/// Returns a base64-encoded string containing the nonce and ciphertext
pub fn encrypt(plaintext: &str) -> Result<String, String> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Generate a random 12-byte nonce
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt the plaintext
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);

    Ok(BASE64.encode(combined))
}

/// Decrypts a base64-encoded encrypted string
pub fn decrypt(encrypted: &str) -> Result<String, String> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Decode from base64
    let combined = BASE64
        .decode(encrypted)
        .map_err(|e| format!("Invalid base64: {}", e))?;

    // Split into nonce (first 12 bytes) and ciphertext (rest)
    if combined.len() < 12 {
        return Err("Encrypted data too short".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let original = "sk-ant-test-session-key-12345";
        let encrypted = encrypt(original).unwrap();

        // Encrypted should be different from original
        assert_ne!(encrypted, original);

        // Should be base64 encoded
        assert!(BASE64.decode(&encrypted).is_ok());

        // Should decrypt back to original
        let decrypted = decrypt(&encrypted).unwrap();
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_encrypt_produces_different_output() {
        let original = "test-value";
        let encrypted1 = encrypt(original).unwrap();
        let encrypted2 = encrypt(original).unwrap();

        // Due to random nonce, each encryption should produce different output
        assert_ne!(encrypted1, encrypted2);

        // But both should decrypt to the same value
        assert_eq!(decrypt(&encrypted1).unwrap(), original);
        assert_eq!(decrypt(&encrypted2).unwrap(), original);
    }

    #[test]
    fn test_decrypt_invalid_base64() {
        let result = decrypt("not-valid-base64!!!");
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_too_short() {
        let result = decrypt(&BASE64.encode([0u8; 5]));
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_tampered_data() {
        let original = "secret-value";
        let encrypted = encrypt(original).unwrap();

        // Tamper with the encrypted data
        let mut bytes = BASE64.decode(&encrypted).unwrap();
        if let Some(byte) = bytes.last_mut() {
            *byte ^= 0xFF;
        }
        let tampered = BASE64.encode(&bytes);

        // Decryption should fail due to authentication tag mismatch
        let result = decrypt(&tampered);
        assert!(result.is_err());
    }
}
