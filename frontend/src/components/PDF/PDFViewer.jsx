import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebViewer from '@pdftron/webviewer';
import { getDocumentUrl } from '../../services/documentService';

export default function PDFViewer() {
  const viewerRef = useRef(null);
  const instanceRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { document, mode } = location.state || {};

  
  const getDocumentUrlForViewer = (doc) => {
    if (!doc) return null;
    
    
    if (doc.downloadUrl) {
      console.log('Using enhanced download URL:', doc.downloadUrl);
      return doc.downloadUrl;
    }
    
    // Fallback to manual URL construction
    return getDocumentUrl(doc);
  };

  useEffect(() => {
    if (!document) {
      navigate('/documents');
      return;
    }

    const documentUrl = getDocumentUrlForViewer(document);
    if (!documentUrl) {
      setError('Document URL not found. Please check the document configuration.');
      setIsLoading(false);
      return;
    }

    console.log('Loading document:', {
      document,
      documentUrl,
      mode
    });

    //  prevent memory leaks
    const cleanup = () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.UI.dispose();
        } catch (err) {
          console.warn('Error disposing WebViewer instance:', err);
        }
        instanceRef.current = null;
      }
    };

    if (viewerRef.current && !instanceRef.current) {
      setIsLoading(true);
      setError(null);

      // Test if document URL is accessible
      fetch(documentUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Document not found (${response.status}): ${response.statusText}`);
          }
          return initializeWebViewer(documentUrl);
        })
        .catch(error => {
          console.error('Document accessibility check failed:', error);
          // Try to initialize anyway - sometimes HEAD requests fail but GET works
          initializeWebViewer(documentUrl);
        });
    }

    function initializeWebViewer(docUrl) {
      WebViewer(
        {
          path: '/webviewer',
          initialDoc: docUrl,
          enableAnnotations: mode === 'signing',
          enableMeasurement: false,
          enableRedaction: false,
          enableFilePicker: false,
          fullAPI: true,
          
          options: {
            useDownloader: false,
            enableOptimizedWorkers: true,
          },
        
          onError: (err) => {
            console.error('WebViewer UI Error:', err);
            setError('Failed to load PDF viewer interface');
            setIsLoading(false);
          },
          
          disabledElements: mode === 'signing' ? [] : [
            'ribbons',
            'toggleNotesButton',
            'searchButton',
            'menuButton',
          ],
        },
        viewerRef.current
      )
        .then((instance) => {
          instanceRef.current = instance;
          setInstance(instance);
          
          const { documentViewer, annotationManager, Annotations } = instance.Core;

         
          documentViewer.addEventListener('documentLoaded', () => {
            console.log('Document loaded successfully');
            setIsLoading(false);
            setError(null);
          });

          
          documentViewer.addEventListener('loaderror', (err) => {
            console.error('Error loading document:', err);
            setError(`Failed to load document: ${err.message || 'Unknown error'}. Please check if the file exists and is accessible.`);
            setIsLoading(false);
          });

          
          const loadTimeout = setTimeout(() => {
            if (isLoading) {
              setError('Document loading timed out. The file might be too large or the server is not responding.');
              setIsLoading(false);
            }
          }, 200000);  //20 second timeout

          documentViewer.addEventListener('documentLoaded', () => {
            clearTimeout(loadTimeout);
          });

          // Additional error handling for network issues
          documentViewer.addEventListener('beginRendering', () => {
            console.log('Document rendering started');
          });

          documentViewer.addEventListener('finishedRendering', () => {
            console.log('Document rendering completed');
          });

          if (mode === 'signing') {
            // Enable signature features
            instance.UI.enableFeatures([instance.UI.Feature.Signature]);

            // Add custom signature o header
            instance.UI.setHeaderItems((header) => {
              header.push({
                type: 'actionButton',
                img: 'ic_annotation_signature_black_24px',
                title: 'Add Signature',
                onClick: () => {
                  try {
                    const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
                    documentViewer.setToolMode(signatureTool);
                  } catch (err) {
                    console.error('Error enabling signature tool:', err);
                    alert('Failed to enable signature tool');
                  }
                },
              });

              //  save button
              header.push({
                type: 'actionButton',
                img: 'ic_save_black_24px',
                title: 'Save Document',
                onClick: async () => {
                  try {
                    await saveDocumentWithSignatures();
                  } catch (error) {
                    console.error('Error saving document:', error);
                    alert('Failed to save document: ' + error.message);
                  }
                },
              });
            });

            // Liste signature additions
            annotationManager.addEventListener('annotationChanged', (annotations, action) => {
              if (action === 'add') {
                annotations.forEach((annotation) => {
                  if (annotation instanceof Annotations.SignatureWidgetAnnotation || 
                      annotation instanceof Annotations.FreeHandAnnotation) {
                    console.log('Signature added:', annotation);
                  }
                });
              }
            });

            // Enable signature tools in the toolbar
            instance.UI.enableElements([
              'signatureToolButton',
              'freeHandToolButton',
              'stickyToolButton'
            ]);
          } else {
            // Viewing mode - disable editing tools
            instance.UI.disableElements([
              'toolsButton',
              'leftPanelButton',
              'ribbons'
            ]);
          }
        })
        .catch((error) => {
          console.error('Error initializing WebViewer:', error);
          
          // More specific error messages
          if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
            setError('PDF viewer files not found. Please ensure WebViewer UI files are installed in the public/webviewer directory.');
          } else if (error.message.includes('license')) {
            setError('WebViewer license error. Please check your license configuration.');
          } else if (error.message.includes('CORS')) {
            setError('Cross-origin request blocked. Please check your server configuration.');
          } else {
            setError('Failed to initialize PDF viewer: ' + error.message);
          }
          
          setIsLoading(false);
        });
    }

    // Cleanup on unmount
    return cleanup;
  }, [document, mode, navigate]);

  // Function to save document with signatures
  const saveDocumentWithSignatures = async () => {
    if (!instanceRef.current) {
      throw new Error('WebViewer instance not available');
    }

    try {
      const { documentViewer, annotationManager } = instanceRef.current.Core;
      
      // Check if document is loaded
      if (!documentViewer.getDocument()) {
        throw new Error('No document loaded');
      }

      // Get annotations (signatures)
      const annotations = annotationManager.getAnnotationsList();
      const signatures = annotations.filter(annotation => 
        annotation instanceof instanceRef.current.Core.Annotations.SignatureWidgetAnnotation ||
        annotation instanceof instanceRef.current.Core.Annotations.FreeHandAnnotation
      );

      if (signatures.length === 0) {
        alert('Please add at least one signature before saving.');
        return;
      }

      // Export annotations as XFDF
      const xfdfString = await annotationManager.exportAnnotations();
      
      // Get document data with flattened annotations
      const data = await documentViewer.getDocument().getFileData({
        xfdfString,
        flatten: true,
      });

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.title || 'signed-document'}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      alert('Document saved successfully!');
      
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  };

  // Go back to documents list
  const handleGoBack = () => {
    navigate('/documents');
  };

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-3"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Retry
            </button>
          </div>
          
          {/* Debug information */}
          {document && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
              <h4 className="font-bold mb-2">Debug Info:</h4>
              <p><strong>Document ID:</strong> {document._id}</p>
              <p><strong>Filename:</strong> {document.filename}</p>
              <p><strong>Title:</strong> {document.title}</p>
              <p><strong>Attempted URL:</strong> {getDocumentUrlForViewer(document)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
            <p className="text-sm text-gray-500 mt-2">
              {document?.title || document?.filename || 'Untitled Document'}
            </p>
          </div>
        </div>
      )}
      
      {/* Header with document info and back button */}
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">
            {document?.title || 'Document Viewer'}
          </h1>
          {mode === 'signing' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
              Signing Mode
            </span>
          )}
        </div>
        
        {mode === 'signing' && (
          <div className="text-sm text-gray-600">
            Add your signature and click Save to download the signed document
          </div>
        )}
      </div>

      {/* WebViewer container */}
      <div className="webviewer" ref={viewerRef} style={{ height: 'calc(100% - 60px)' }}></div>
    </div>
  );
}