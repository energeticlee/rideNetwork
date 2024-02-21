import {
  generateKeyPairSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  privateDecrypt,
  createPrivateKey,
} from "crypto";
import { CustomerData, EncryptedData } from "./types";
import zlib from "zlib";

//  const { encryptedData, encryptedCombinedRandBase64 } =
//     customerEncryption(publicKeyPem);
//  const decryptedData = driverDecryption(
//     encryptedData,
//     encryptedCombinedRandBase64,
//     privateKeyPem
//   );

export const generateRsaKeypair = () => {
  // Generate an RSA key pair
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  // Convert the private key to PEM format
  const privateKeyPem = privateKey.export({
    format: "pem",
    type: "pkcs8",
  });

  // Convert the public key to PEM format
  const publicKeyPem = publicKey.export({
    format: "pem",
    type: "spki",
  });

  return { publicKeyPem, privateKeyPem };
};

export const customerEncryption = (
  publicKeyPem: string | Buffer,
  customerData: CustomerData
) => {
  // Generate a random AES key
  const aesKey = randomBytes(32); // 256-bit key

  // Generate a random initialization vector (IV)
  const iv = randomBytes(16);

  // Convert the rider data to a string
  const customerDataString = JSON.stringify(customerData);

  // Compress the token using zlib compression
  const compressedData = zlib.gzipSync(customerDataString);

  // Encrypt the rider data with AES
  const cipher = createCipheriv("aes-256-cbc", aesKey, iv);
  let encryptedData = cipher.update(compressedData);
  encryptedData = Buffer.concat([encryptedData, cipher.final()]);

  // Encrypt the AES key and IV with the driver's public key using RSA
  const combinedData = Buffer.concat([aesKey, iv]);
  const encryptedCombinedData = publicEncrypt(publicKeyPem, combinedData);

  // Convert the encrypted combined data to Base64 format
  const encryptedCombinedRandBase64 = encryptedCombinedData.toString("base64");

  // console.log("Encrypted Data (Base64):", encryptedData.toString("base64"));
  // console.log("Encrypted Combined Data (Base64):", encryptedCombinedRandBase64);
  return {
    encryptedData: encryptedData.toString("base64"),
    encryptedCombinedRandBase64,
  };
};

export const driverDecryption = (
  encryptedData: EncryptedData,
  privateKeyPem: string | Buffer
) => {
  // Decode the Base64-encoded encrypted combined data
  const combinedDataX = Buffer.from(
    encryptedData.encryptedCombinedRandBase64,
    "base64"
  );

  // Load the driver's private key
  const driverPrivateKey = createPrivateKey(privateKeyPem);
  const decryptedCombinedData = privateDecrypt(driverPrivateKey, combinedDataX);

  // Split the decrypted combined data into AES key and IV
  const decryptedAesKey = decryptedCombinedData.subarray(0, 32);
  const decryptedIv = decryptedCombinedData.subarray(32);

  // Decrypt the encrypted data using the decrypted AES key and IV
  const decipher = createDecipheriv(
    "aes-256-cbc",
    decryptedAesKey,
    decryptedIv
  );
  // Decode the Base64-encoded encrypted data
  const encryptedDataBase64 = Buffer.from(
    encryptedData.encryptedData,
    "base64"
  );

  // Decrypt the encrypted data using the decrypted AES key and IV
  let decryptedData = decipher.update(encryptedDataBase64);
  decryptedData = Buffer.concat([decryptedData, decipher.final()]);

  // Decompress the decrypted data using zlib
  const decompressedData = zlib.gunzipSync(decryptedData);

  return decompressedData.toString();
};
