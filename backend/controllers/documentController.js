const Document = require('../models/Document');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, signerName, signerEmail } = req.body;

    // Validate signer information
    if (!signerName || !signerEmail) {
      return res.status(400).json({ message: 'Signer name and email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerEmail)) {
      return res.status(400).json({ message: 'Invalid signer email format' });
    }

    // Check if signer is registered in the app
    const signerUser = await User.findOne({ email: signerEmail });
    if (!signerUser) {
      return res.status(404).json({ message: 'Signer email not found. The signer must be registered in the app.' });
    }

    const document = await Document.create({
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      owner: req.user.id,
      signerName: signerName,
      signerEmail: signerEmail,
      signerUser: signerUser._id,
      status: 'pending_signature',
      sentAt: new Date()
    });

    await document.populate('owner', 'name email');
    await document.populate('signerUser', 'name email');

    res.status(201).json({
      success: true,
      document,
      message: `Document uploaded successfully and assigned to ${signerName} (${signerEmail})`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id },
        { signerUser: req.user.id } // Include documents where user is the signer
      ]
    })
    .populate('owner', 'name email')
    .populate('signerUser', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocumentsForSigning = async (req, res) => {
  try {
    const documents = await Document.find({
      signerUser: req.user.id,
      owner: { $ne: req.user.id } // Exclude documents where user is both owner and signer
    })
    .populate('owner', 'name email')
    .select('title filename status createdAt sentAt dueDate owner signerName signerEmail')
    .sort({ sentAt: -1 });

    // Transform the documents to match the expected response format
    const transformedDocuments = documents.map(doc => ({
      _id: doc._id,
      title: doc.title,
      filename: doc.filename,
      senderName: doc.owner.name,
      senderEmail: doc.owner.email,
      status: doc.status === 'pending_signature' ? 'pending' : doc.status,
      createdAt: doc.createdAt,
      sentAt: doc.sentAt,
      dueDate: doc.dueDate || null
    }));

    res.json({
      success: true,
      documents: transformedDocuments
    });
  } catch (error) {
    console.error('Get documents for signing error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSharedDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { 'collaborators.user': req.user.id },
        { signerUser: req.user.id }
      ],
      owner: { $ne: req.user.id } // Exclude documents owned by the user
    })
    .populate('owner', 'name email')
    .populate('signerUser', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ createdAt: -1 });

    // Add user role information to each document
    const documentsWithRole = documents.map(doc => {
      const docObj = doc.toObject();
      docObj.userRole = doc.getUserRole(req.user.id);
      return docObj;
    });

    res.json({
      success: true,
      documents: documentsWithRole
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('signerUser', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('signatures');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const hasAccess = document.owner._id.toString() === req.user.id ||
      document.collaborators.some(collab => collab.user._id.toString() === req.user.id) ||
      (document.signerUser && document.signerUser._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add user role to response
    const docObj = document.toObject();
    docObj.userRole = document.getUserRole(req.user.id);

    res.json({
      success: true,
      document: docObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to update
    const userRole = document.getUserRole(req.user.id);
    if (!userRole || (userRole !== 'owner' && userRole !== 'edit')) {
      return res.status(403).json({ message: 'Insufficient permissions to update document' });
    }

    // Update allowed fields
    if (title !== undefined) document.title = title;
    if (description !== undefined) document.description = description;
    
    // Only owner can change status
    if (status !== undefined && userRole === 'owner') {
      document.status = status;
    }

    await document.save();
    await document.populate('owner', 'name email');
    await document.populate('signerUser', 'name email');
    await document.populate('collaborators.user', 'name email');

    res.json({
      success: true,
      document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
      
   
    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('signerUser', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions (owner, collaborator, or signer)
    const hasAccess = document.owner._id.toString() === req.user.id ||
      document.collaborators.some(collab => collab.user.toString() === req.user.id) ||
      (document.signerUser && document.signerUser._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to download this document' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set download headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { email, permission } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can add collaborators' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to add themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot add yourself as collaborator' });
    }

    // if already a collaborator
    const existingCollaborator = document.collaborators.find(
      collab => collab.user.toString() === user._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    document.collaborators.push({
      user: user._id,
      permission: permission || 'view'
    });

    await document.save();
    await document.populate('collaborators.user', 'name email');

    res.json({
      success: true,
      document,
      message: `Collaborator ${user.name} added successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.shareDocument = async (req, res) => {
  try {
    const { emails, permission, message } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    //  if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can share documents' });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Email addresses are required' });
    }

    const results = {
      added: [],
      existing: [],
      notFound: []
    };

    for (const email of emails) {
      // Find email
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      
      if (!user) {
        results.notFound.push(email);
        continue;
      }

      // Skip if user is the owner
      if (user._id.toString() === req.user.id) {
        continue;
      }

      // already a collaborator
      const existingCollaborator = document.collaborators.find(
        collab => collab.user.toString() === user._id.toString()
      );

      if (existingCollaborator) {
        results.existing.push({ email, name: user.name });
        continue;
      }



      // Add collaborator
      document.collaborators.push({
        user: user._id,
        permission: permission || 'view'
      });

      results.added.push({ email, name: user.name });
    }

    if (results.added.length > 0) {
      await document.save();
    }

    await document.populate('collaborators.user', 'name email');

    res.json({
      success: true,
      document,
      results,
      message: `Document shared with ${results.added.length} user(s)`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};