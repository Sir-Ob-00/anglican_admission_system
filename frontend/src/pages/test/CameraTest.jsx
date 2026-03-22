import { useState, useRef } from 'react';

export default function CameraTest() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const videoRef = useRef(null);

  const checkCameraPermission = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      setPermissionStatus(permissions.state);
      
      permissions.addEventListener('change', () => {
        setPermissionStatus(permissions.state);
      });
      
      console.log('Camera permission status:', permissions.state);
    } catch (err) {
      console.log('Permission API not supported:', err);
    }
  };

  const requestCameraAccess = async () => {
    try {
      setError('');
      
      // First check permission status
      await checkCameraPermission();
      
      // Request camera access with specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      console.log('Camera access granted');
      
    } catch (err) {
      console.error('Camera access error:', err);
      
      let errorMessage = '';
      switch (err.name) {
        case 'NotAllowedError':
          errorMessage = `Camera access denied. 

To fix this:
1. Click the camera icon (📷) or lock icon in your browser address bar
2. Select "Allow" for camera access
3. Refresh the page and try again

If you already denied access:
1. Go to browser settings > Privacy and security > Site settings
2. Find this site and allow camera access
3. Refresh the page`;
          break;
          
        case 'NotFoundError':
          errorMessage = 'No camera found. Please connect a camera and try again.';
          break;
          
        case 'NotReadableError':
          errorMessage = 'Camera is already in use by another application. Close other apps and try again.';
          break;
          
        case 'OverconstrainedError':
          errorMessage = 'Camera does not support the requested constraints. Try a different camera.';
          break;
          
        case 'TypeError':
          errorMessage = 'Camera API not supported in this browser. Try using Chrome, Firefox, or Edge.';
          break;
          
        default:
          errorMessage = `Unknown error: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const resetPermissions = () => {
    // Instructions for resetting permissions
    alert(`To reset camera permissions:

Chrome/Edge:
1. Click the lock icon in address bar
2. Find "Camera" and set to "Allow"
3. Refresh the page

Firefox:
1. Click the shield icon in address bar
2. Toggle camera to "Allow"
3. Refresh the page

Safari:
1. Go to Safari > Preferences > Websites > Camera
2. Find this site and set to "Allow"
3. Refresh the page`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Camera Access Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Permission Status</h2>
          <div className="space-y-2">
            <p><strong>Current Status:</strong> {permissionStatus}</p>
            <p className="text-sm text-gray-600">
              Status meanings: 
              <br />• "granted" - Camera access allowed
              <br />• "denied" - Camera access blocked
              <br />• "prompt" - Will ask when needed
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Camera Controls</h2>
          <div className="space-x-4">
            <button
              onClick={requestCameraAccess}
              disabled={stream !== null}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {stream ? 'Camera Active' : 'Start Camera'}
            </button>
            
            <button
              onClick={stopCamera}
              disabled={stream === null}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Stop Camera
            </button>
            
            <button
              onClick={resetPermissions}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Reset Instructions
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Error</h3>
            <p className="text-red-700 whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Camera Preview</h2>
          <div className="bg-black rounded-lg overflow-hidden" style={{ minHeight: '360px' }}>
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <p>Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Browser Compatibility</h2>
          <div className="text-sm text-gray-600">
            <p><strong>Recommended Browsers:</strong></p>
            <ul className="list-disc list-inside mt-2">
              <li>Chrome 53+</li>
              <li>Firefox 36+</li>
              <li>Edge 79+</li>
              <li>Safari 11+</li>
            </ul>
            <p className="mt-4"><strong>Requirements:</strong></p>
            <ul className="list-disc list-inside mt-2">
              <li>HTTPS connection (required for camera access)</li>
              <li>Physical camera device</li>
              <li>Browser permission for camera access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
