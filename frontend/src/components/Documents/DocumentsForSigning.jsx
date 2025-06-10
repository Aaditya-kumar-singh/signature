import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsService } from '../../services/documentService';

const DocumentsForSigning = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching documents for signing...');
      const response = await documentsService.getDocumentsForSigning();
      console.log('API Response:', response);
      
      if (response && response.success) {
        if (response.documents && Array.isArray(response.documents)) {
          setDocuments(response.documents);
        } else {
          console.error('Documents array is missing or invalid:', response);
          setError('No documents found in response');
        }
      } else {
        console.error('Unexpected response structure:', response);
        setError(response?.message || 'Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Documents endpoint not found. Please check your API configuration.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to fetch documents. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = (document) => {
    navigate('/pdf-viewer', { 
      state: { 
        document,
        mode: 'signing' 
      } 
    });
  };

  const handleViewDocument = (document) => {
    navigate('/pdf-viewer', { 
      state: { 
        document,
        mode: 'view' 
      } 
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDocuments}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Documents for Signing</h1>
        <button
          onClick={fetchDocuments}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents to sign</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have any documents waiting for your signature.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.map((document) => (
              <li key={document._id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {document.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        From: {document.senderName} ({document.senderEmail})
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        document.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : document.status === 'signed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        {document.filename}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <p>
                        Sent {new Date(document.sentAt).toLocaleDateString()}
                        {document.dueDate && (
                          <span className="ml-2">
                            • Due {new Date(document.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {document.status === 'pending' && (
                    <div className="mt-3 flex space-x-3">
                      <button 
                        onClick={() => handleSignDocument(document)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        Sign Document
                      </button>
                      <button 
                        onClick={() => handleViewDocument(document)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentsForSigning;