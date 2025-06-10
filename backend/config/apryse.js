const fs = require('fs');
const path = require('path');
const { PDFNet } = require('@pdftron/pdfnet-node');

const initializeApryse = async () => {
  try {
    const key = process.env.APRYSE_LICENSE_KEY;
    await PDFNet.initialize(key);
    console.log('Apryse SDK initialized successfully');
  } catch (err) {
    console.error('Error initializing Apryse SDK:', err);
  }
};

module.exports = initializeApryse;