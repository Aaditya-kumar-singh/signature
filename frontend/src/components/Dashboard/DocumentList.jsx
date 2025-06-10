import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, Calendar, Trash2, User, Mail, Send } from 'lucide-react'
import { useDocuments } from '../../contexts/DocumentContext'
import { useAuth } from '../../contexts/AuthContext' // Changed from ../../hooks/useAuth

const DocumentList = ({ documents }) => {
  const { deleteDocument } = useDocuments()
  const { user } = useAuth()

  const handleDelete = async (documentId, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId)
      } catch (error) {
        console.error('Failed to delete document:', error)
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'signed':
        return 'bg-blue-100 text-blue-800'
      case 'pending_signature':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserRole = (document) => {
    if (document.owner && document.owner._id === user.id) {
      return 'owner'
    }
    if (document.signerUser && document.signerUser._id === user.id) {
      return 'signer'
    }
    const collaborator = document.collaborators.find(collab => 
      collab.user._id === user.id
    )
    if (collaborator) {
      return collaborator.permission
    }
    return null
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'signer':
        return 'Signer'
      case 'view':
        return 'Viewer'
      case 'edit':
        return 'Editor'
      default:
        return ''
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'signer':
        return 'bg-blue-100 text-blue-800'
      case 'view':
        return 'bg-gray-100 text-gray-800'
      case 'edit':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">No documents found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const userRole = getUserRole(document)
        const isOwner = userRole === 'owner'
        const isSigner = userRole === 'signer'
        
        return (
          <Link
            key={document._id}
            to={`/document/${document._id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FileText className="h-8 w-8 text-red-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{document.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(userRole)}`}>
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{document.originalName}</p>
                  
                  {/* Document description if available */}
                  {document.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{document.description}</p>
                  )}
                  
                  {/* Signer information */}
                  {document.signerName && document.signerEmail && (
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Signer: {document.signerName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{document.signerEmail}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(document.createdAt)}</span>
                    </span>
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{document.collaborators.length} collaborators</span>
                    </span>
                    {document.sentAt && (
                      <span className="flex items-center space-x-1">
                        <Send className="h-3 w-3" />
                        <span>Sent {formatDate(document.sentAt)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(document.status)}`}>
                  {document.status.replace('_', ' ')}
                </span>
                
                {/* Only show delete button for document owners */}
                {isOwner && (
                  <button
                    onClick={(e) => handleDelete(document._id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Additional info for signers */}
            {isSigner && document.status === 'pending_signature' && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Action Required:</strong> This document is waiting for your signature.
              </div>
            )}
            
            {/* Additional info for owners */}
            {isOwner && document.status === 'pending_signature' && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Pending:</strong> Waiting for {document.signerName} to sign this document.
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default DocumentList