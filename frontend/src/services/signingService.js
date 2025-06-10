import api from './api';

export const signDocument = async (documentId, signatureData) => {
  const response = await api.post('/signing/sign', {
    documentId,
    ...signatureData,
  });
  return response.data;
};

export const verifySignature = async (documentId) => {
  const response = await api.get(`/signing/verify/${documentId}`);
  return response.data;
};