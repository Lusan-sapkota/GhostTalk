import base64
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

class EncryptionService:
    def __init__(self):
        self.backend = default_backend()
        
    def generate_key(self):
        """Generate a new random encryption key"""
        return os.urandom(32)  # 256-bit key
    
    def encrypt_message(self, message, key):
        """Encrypt a message with the given key"""
        # Generate a random IV
        iv = os.urandom(16)
        
        # Create an encryptor
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        
        # Pad the message
        padder = padding.PKCS7(algorithms.AES.block_size).padder()
        padded_data = padder.update(message.encode()) + padder.finalize()
        
        # Encrypt the padded message
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Combine IV and ciphertext and base64 encode
        encrypted = base64.b64encode(iv + ciphertext).decode('utf-8')
        
        return encrypted
    
    def decrypt_message(self, encrypted, key):
        """Decrypt an encrypted message with the given key"""
        # Base64 decode
        data = base64.b64decode(encrypted.encode('utf-8'))
        
        # Extract IV (first 16 bytes)
        iv = data[:16]
        ciphertext = data[16:]
        
        # Create a decryptor
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=self.backend)
        decryptor = cipher.decryptor()
        
        # Decrypt the ciphertext
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Unpad the data
        unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return data.decode('utf-8')