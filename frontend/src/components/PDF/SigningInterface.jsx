import { useState, useRef } from 'react';
import { signDocument } from '../../services/signingService';

export default function SigningInterface({ documentId, onSignComplete }) {
  const [signature, setSignature] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignature(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!signature) {
      setError('Please add a signature');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const signedDoc = await signDocument(documentId, {
        signatureData: signature,
        position,
      });
      onSignComplete(signedDoc);
    } catch (err) {
      setError('Failed to sign document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Sign Document</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Signature Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleSignatureChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
        />
        {signature && (
          <img
            src={signature}
            alt="Signature preview"
            className="h-20 border border-gray-300"
          />
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Click on the canvas to set signature position
        </label>
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-64 border border-gray-300 bg-gray-100 relative"
        >
          {position && (
            <div
              className="absolute bg-blue-500 bg-opacity-50"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '100px',
                height: '50px',
              }}
            ></div>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Position: X: {position.x}, Y: {position.y}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !signature}
        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Signing...' : 'Sign Document'}
      </button>
    </div>
  );
}