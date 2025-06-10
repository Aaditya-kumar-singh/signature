const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Signer information
  signerName: {
    type: String,
    trim: true
  },
  signerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  signerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: {
    type: Date
  },
  signedAt: {
    type: Date
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'sign', 'edit'],
      default: 'view'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'pending_signature', 'signed', 'completed'],
    default: 'draft'
  },
  signatures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signature'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
documentSchema.index({ owner: 1 });
documentSchema.index({ signerUser: 1 });
documentSchema.index({ signerEmail: 1 });
documentSchema.index({ status: 1 });

// Virtual to check if document is assigned to a signer
documentSchema.virtual('hasSignerAssigned').get(function() {
  return !!(this.signerEmail && this.signerName);
});

// Virtual to get user's role in document
documentSchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    return 'owner';
  }
  if (this.signerUser && this.signerUser.toString() === userId.toString()) {
    return 'signer';
  }
  const collaborator = this.collaborators.find(collab => 
    collab.user.toString() === userId.toString()
  );
  if (collaborator) {
    return collaborator.permission;
  }
  return null;
};

module.exports = mongoose.model('Document', documentSchema);