import React, { useState } from 'react'
import DocumentList from './DocumentList'
import PDFUpload from '../PDF/PDFUpload'
import { useDocuments } from '../../contexts/DocumentContext'

const Dashboard = () => {
  const { documents, loading, fetchDocuments } = useDocuments()
  const [signerEmail, setSignerEmail] = useState('')
  const [signerName, setSignerName] = useState('')

  // Handle successful upload
  const handleUploadSuccess = (uploadedDoc) => {
    // Refresh the documents list after successful upload
    fetchDocuments();
         
    // Optional: You can also add a success message here
    if (uploadedDoc) {
      console.log('Document uploaded successfully:', uploadedDoc);
      // Reset signer information after successful upload
      // setSignerEmail('');
      // setSignerName('');
    } else {
      console.log('Document uploaded successfully, but no data returned');
    }
  }

  // Clear signer information
  const clearSignerInfo = () => {
    setSignerEmail('');
    setSignerName('');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Signer Information Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Signer Information</h3>
            {(signerName || signerEmail) && (
              <button
                onClick={clearSignerInfo}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="signerName" className="block text-sm font-medium text-gray-700 mb-2">
                Signer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter signer name"
                required
              />
            </div>
            <div>
              <label htmlFor="signerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Signer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="signerEmail"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter signer email"
                required
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            The uploaded document will be sent to this email address for signing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <PDFUpload 
            onUploadSuccess={handleUploadSuccess}
            signerName={signerName}
            signerEmail={signerEmail}
          />
        </div>
                 
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Documents</h3>
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <DocumentList documents={documents.slice(0, 5)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard