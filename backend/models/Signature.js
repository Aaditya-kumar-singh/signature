const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  signer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  signatureData: {
    type: String,
    required: true // Base64 encoded signature image
  },
  position: {
    x: Number,
    y: Number,
    page: Number,
    width: Number,
    height: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Signature', signatureSchema);