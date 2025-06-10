import axios from 'axios';

// ✅ Use Vite's import.meta.env for environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // redirect to login page
    }
    return Promise.reject(error);
  }
);

// ✅ Helper function to get document URL
const getDocumentUrl = (document) => {
  if (!document) return null;
  
  // If document already has a full URL
  if (document.fileUrl || document.url) {
    return document.fileUrl || document.url;
  }
  
  // If document has a file path, construct full URL
  if (document.filePath) {
    return `${BASE_URL}${document.filePath.startsWith('/') ? '' : '/'}${document.filePath}`;
  }
  
  // If document has an ID, use download endpoint
  if (document._id) {
    return `${BASE_URL}/api/documents/${document._id}/download`;
  }
  
  return null;
};

// ✅ Document Service Methods
export const documentsService = {
  // Upload document
  uploadDocument: async (formData) => {
    try {
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  },

  // Get all documents
  getDocuments: async () => {
    try {
      const response = await api.get('/documents');
      return response.data;
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  },

  // Get documents assigned for signing
  getDocumentsForSigning: async () => {
    try {
      console.log('Calling /documents/for-signing endpoint...');
      const response = await api.get('/documents/for-signing');
      console.log('Raw API response:', response);
      
      // Enhance documents with proper URLs
      if (response.data && response.data.documents) {
        response.data.documents = response.data.documents.map(doc => ({
          ...doc,
          downloadUrl: getDocumentUrl(doc),
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Get documents for signing error:', error);
      throw error;
    }
  },

  // Get shared documents
  getSharedDocuments: async () => {
    try {
      const response = await api.get('/documents/shared');
      return response.data;
    } catch (error) {
      console.error('Get shared documents error:', error);
      throw error;
    }
  },

  // Get single document
  getDocument: async (id) => {
    try {
      const response = await api.get(`/documents/${id}`);
      
      // Enhance document with proper URL
      if (response.data && response.data.document) {
        response.data.document.downloadUrl = getDocumentUrl(response.data.document);
      }
      
      return response.data;
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  // Get document download URL
  getDocumentDownloadUrl: (document) => {
    return getDocumentUrl(document);
  },

  // Download document
  downloadDocument: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Download document error:', error);
      throw error;
    }
  },

  // Update document
  updateDocument: async (id, data) => {
    try {
      const response = await api.put(`/documents/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },

  // Share document
  shareDocument: async (id, data) => {
    try {
      const response = await api.post(`/documents/${id}/share`, data);
      return response.data;
    } catch (error) {
      console.error('Share document error:', error);
      throw error;
    }
  },

  // Add collaborator
  addCollaborator: async (id, data) => {
    try {
      const response = await api.post(`/documents/${id}/collaborators`, data);
      return response.data;
    } catch (error) {
      console.error('Add collaborator error:', error);
      throw error;
    }
  },

  // Sign document
  signDocument: async (id, signatureData) => {
    try {
      const response = await api.post(`/documents/${id}/sign`, signatureData);
      return response.data;
    } catch (error) {
      console.error('Sign document error:', error);
      throw error;
    }
  },
};

// Export helper function for use in components
export { getDocumentUrl };