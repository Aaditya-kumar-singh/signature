const express = require('express');
const { addSignature, getSignatures, getDocumentsForSigning } = require('../controllers/signingController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get documents that need signing by current user
router.get('/documents', auth, getDocumentsForSigning);

// Add signature to document
router.post('/sign', auth, addSignature);

// Get signatures for a specific document
router.get('/:documentId', auth, getSignatures);

module.exports = router;