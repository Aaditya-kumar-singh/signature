import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DocumentProvider } from './contexts/DocumentContext'
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import DocumentsForSigning from './components/Documents/DocumentsForSigning'
import PDFViewer from './components/PDF/PDFViewer'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dashboard route - this was missing! */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Root route redirects to dashboard */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Documents for signing */}
              <Route path="/documents" element={
                <ProtectedRoute>
                  <Layout>
                    <DocumentsForSigning />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Documents for signing (alternative path) */}
              <Route path="/documents-for-signing" element={
                <ProtectedRoute>
                  <Layout>
                    <DocumentsForSigning />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* PDF viewer for signing documents */}
              <Route path="/sign/:documentId" element={
                <ProtectedRoute>
                  <PDFViewer mode="sign" />
                </ProtectedRoute>
              } />
              
              {/* PDF viewer general route */}
              <Route path="/pdf-viewer" element={
                <ProtectedRoute>
                  <PDFViewer />
                </ProtectedRoute>
              } />
              
              {/* Document viewing with ID parameter */}
              <Route path="/document/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PDFViewer />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* View document route (alternative) */}
              <Route path="/view/:documentId" element={
                <ProtectedRoute>
                  <PDFViewer mode="view" />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </DocumentProvider>
    </AuthProvider>
  )
}

export default App