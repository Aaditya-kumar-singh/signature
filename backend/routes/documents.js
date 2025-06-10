const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload document
router.post('/', auth, upload.single('document'), documentController.uploadDocument);

// Get all documents
router.get('/', auth, documentController.getDocuments);

// Get documents for signing - NEW ROUTE
router.get('/for-signing', auth, documentController.getDocumentsForSigning);

// Get shared documents
router.get('/shared', auth, documentController.getSharedDocuments);

// Download document - MOVED BEFORE /:id
router.get('/:id/download', auth, documentController.downloadDocument);

// Get single document - MOVED AFTER more specific routes
router.get('/:id', auth, documentController.getDocument);

// Update document
router.put('/:id', auth, documentController.updateDocument);

// Delete document
router.delete('/:id', auth, documentController.deleteDocument);

// Share document
router.post('/:id/share', auth, documentController.shareDocument);

// Add collaborator
router.post('/:id/collaborators', auth, documentController.addCollaborator);

module.exports = router;