import React, { createContext, useContext, useState, useEffect } from 'react'
import { documentsService } from '../services/documentService';
import { useAuth } from './AuthContext'

const DocumentContext = createContext()

export const useDocuments = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchDocuments = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await documentService.getDocuments()
      setDocuments(response.documents)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (file, title) => {
    try {
      setError(null)
      const response = await documentService.uploadDocument(file, title)
      setDocuments(prev => [response.document, ...prev])
      return response.document
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload document')
      throw error
    }
  }

  const deleteDocument = async (documentId) => {
    try {
      setError(null)
      await documentService.deleteDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc._id !== documentId))
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete document')
      throw error
    }
  }

  const addCollaborator = async (documentId, email, permission) => {
    try {
      setError(null)
      const response = await documentService.addCollaborator(documentId, email, permission)
      setDocuments(prev => 
        prev.map(doc => doc._id === documentId ? response.document : doc)
      )
      return response.document
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add collaborator')
      throw error
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user])

  const value = {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    addCollaborator,
    setError
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}
