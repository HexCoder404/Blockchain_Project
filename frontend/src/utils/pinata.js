import axios from 'axios';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export async function uploadToPinata(encryptedBlob, filename) {
  if (!PINATA_JWT) throw new Error("Pinata JWT not configured in .env. Please add VITE_PINATA_JWT.");
  
  const formData = new FormData();
  formData.append('file', new Blob([encryptedBlob]), filename);
  
  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return res.data.IpfsHash; // Returns the CID
}
