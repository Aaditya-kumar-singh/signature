const Signature = require('../models/Signature');
const Document = require('../models/Document');

exports.addSignature = async (req, res) => {
  try {
    const { documentId, signatureData, position } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has signing permission
    const hasSigningAccess = document.owner.toString() === req.user.id ||
      document.collaborators.some(collab => 
        collab.user.toString() === req.user.id && 
        ['sign', 'edit'].includes(collab.permission)
      );

    if (!hasSigningAccess) {
      return res.status(403).json({ message: 'No signing permission' });
    }

    const signature = await Signature.create({
      document: documentId,
      signer: req.user.id,
      signatureData,
      position,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    document.signatures.push(signature._id);
    document.status = 'signed';
    await document.save();

    await signature.populate('signer', 'name email');

    res.status(201).json({
      success: true,
      signature
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ document: req.params.documentId })
      .populate('signer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      signatures
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW METHOD - Get documents that need signing by the current user
exports.getDocumentsForSigning = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find documents where:
    // 1. User is a collaborator with 'sign' permission
    // 2. Document status is 'pending' or 'review'
    // 3. User hasn't signed yet (optional - depends on your business logic)
    const documents = await Document.find({
      $and: [
        {
          $or: [
            // User is owner
            { owner: userId },
            // User is collaborator with sign permission
            {
              collaborators: {
                $elemMatch: {
                  user: userId,
                  permission: { $in: ['sign', 'edit'] }
                }
              }
            }
          ]
        },
        // Document needs signing
        { status: { $in: ['pending', 'review', 'uploaded'] } }
      ]
    })
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email')
    .populate('signatures', 'signer createdAt')
    .sort({ createdAt: -1 });

    // Filter out documents the user has already signed (optional)
    const documentsNeedingSigning = documents.filter(doc => {
      // Check if user has already signed this document
      const userHasSigned = doc.signatures.some(sig => 
        sig.signer && sig.signer.toString() === userId
      );
      return !userHasSigned;
    });

    res.json({
      success: true,
      documents: documentsNeedingSigning,
      total: documentsNeedingSigning.length
    });
  } catch (error) {
    console.error('Error fetching documents for signing:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};