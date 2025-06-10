import { useState } from 'react';
import { documentsService } from '../../services/documentService';

export default function PDFUpload({ onUploadSuccess, signerName, signerEmail }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      setError('Please select a PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!signerName || !signerEmail) {
      setError('Please provide signer name and email in the dashboard');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerEmail)) {
      setError('Please provide a valid signer email');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('signerName', signerName);
      formData.append('signerEmail', signerEmail);

      const uploadedDoc = await documentsService.uploadDocument(formData);

      // Reset form after successful upload
      setFile(null);
      setTitle('');
      setDescription('');

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

      onUploadSuccess(uploadedDoc);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload PDF Document</h2>

      {/* Signer Info Display */}
      {signerName && signerEmail && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Document will be sent to:</strong> {signerName} ({signerEmail})
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            PDF File
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter document title"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter document description (optional)"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !signerName || !signerEmail}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload & Send Document'}
        </button>

        {(!signerName || !signerEmail) && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Please fill in signer information above to enable upload
          </p>
        )}
      </form>
    </div>
  );
}
