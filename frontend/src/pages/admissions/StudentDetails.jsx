import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { getStudentDetails, updateStudent, deleteStudent } from "../../services/admissionService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AdmissionDetails() {
  const { id } = useParams();
  const { role } = useAuth();
  const [item, setItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getStudentDetails(id);
        if (!ignore) {
          setItem(data);
          setEditForm({
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            gender: data.gender,
            admittedClass: data.admittedClass,
            parentContact: data.parentContact,
            parentName: data.parentName,
            address: data.address,
            homeTown: data.homeTown || '',
            currentLocation: data.currentLocation || '',
            nationality: data.nationality || '',
            region: data.region || '',
            profilePicture: data.profilePicture || ''
          });
        }
      } catch {
        if (!ignore) setItem(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setEditForm({ ...editForm, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setCameraError('');
      setShowCameraModal(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      setCameraStream(stream);
      
      // Wait for video to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
            setCameraError('Failed to start camera preview');
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Camera access denied. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.\n\n' +
          'To fix this:\n' +
          '1. Click the camera icon (📷) in your browser address bar\n' +
          '2. Select "Allow" for camera access\n' +
          '3. Refresh the page and try again';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please use file upload instead.';
      }
      
      setCameraError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleTakePhoto = () => {
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update form and preview
        setProfileImagePreview(imageData);
        setEditForm({ ...editForm, profilePicture: imageData });
        
        // Close camera modal
        handleCloseCamera();
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      alert('Failed to capture photo. Please try again.');
    }
  };

  const handleCloseCamera = () => {
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    
    // Close modal
    setShowCameraModal(false);
    setCameraError('');
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateStudent(id, editForm);
      setIsEditing(false);
      setItem({ ...item, ...editForm });
      alert('Student information updated successfully!');
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update student";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteStudent(id);
      alert('Student deleted successfully!');
      window.history.back();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete student";
      alert(message);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const canEdit = role === 'admin' || role === 'headteacher' || role === 'assistantHeadteacher';
  const canDelete = role === 'admin' || role === 'headteacher';

  return (
    <div className="space-y-4">
      <PageHeader title="Admission Details" subtitle="Complete student information and management." />
      
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="font-display text-xl font-semibold text-slate-900">Admission {id}</div>
            <div className="mt-1 text-sm text-slate-600">
              Student management for {item?.fullName || "Loading..."}.
            </div>
          </div>
          <div className="flex gap-2">
            <Badge tone={item ? "success" : "warning"}>{item ? "Loaded" : "No data"}</Badge>
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex h-8 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex h-8 items-center justify-center rounded-2xl bg-red-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900 mb-4">Profile Picture</div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {profileImagePreview || editForm.profilePicture ? (
                    <img src={profileImagePreview || editForm.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">No Photo</span>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleCameraCapture}
                    className="inline-flex h-8 items-center justify-center rounded-2xl bg-green-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    📷 Access Camera
                  </button>
                  <label className="inline-flex h-8 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer">
                    📁 Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900 mb-4">Personal Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Admitted Class</label>
                  <input
                    type="text"
                    value={editForm.admittedClass || ''}
                    onChange={(e) => setEditForm({ ...editForm, admittedClass: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900 mb-4">Location Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Home Town</label>
                  <input
                    type="text"
                    value={editForm.homeTown || ''}
                    onChange={(e) => setEditForm({ ...editForm, homeTown: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={editForm.currentLocation || ''}
                    onChange={(e) => setEditForm({ ...editForm, currentLocation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={editForm.nationality || ''}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={editForm.region || ''}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="text-sm font-semibold text-slate-900 mb-4">Parent Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={editForm.parentName || ''}
                    onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parent Contact</label>
                  <input
                    type="text"
                    value={editForm.parentContact || ''}
                    onChange={(e) => setEditForm({ ...editForm, parentContact: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* View Mode - Display all information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Personal Information</div>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {item?.fullName || "—"}</div>
                  <div><strong>Date of Birth:</strong> {item?.dateOfBirth ? formatDate(item.dateOfBirth) : "—"}</div>
                  <div><strong>Gender:</strong> {item?.gender || "—"}</div>
                  <div><strong>Admitted Class:</strong> {item?.admittedClass || "—"}</div>
                </div>
              </div>
              
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Parent Info</div>
                <div className="space-y-2 text-sm">
                  <div><strong>Parent Contact:</strong> {item?.parentContact || "—"}</div>
                  <div><strong>Parent Name:</strong> {item?.parentName || "—"}</div>
                  <div><strong>Address:</strong> {item?.address || "—"}</div>
                </div>
              </div>
              
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Location Information</div>
                <div className="space-y-2 text-sm">
                  <div><strong>Home Town:</strong> {item?.homeTown || "—"}</div>
                  <div><strong>Current Location:</strong> {item?.currentLocation || "—"}</div>
                  <div><strong>Nationality:</strong> {item?.nationality || "—"}</div>
                  <div><strong>Region:</strong> {item?.region || "—"}</div>
                </div>
              </div>
              
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Profile Picture</div>
                <div className="flex items-center">
                  {item?.profilePicture ? (
                    <img src={item.profilePicture} alt="Profile" className="w-32 h-32 rounded-lg object-cover" />
                  ) : (
                    <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400 text-sm">No Photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Admission Details</div>
                <div className="space-y-2 text-sm">
                  <div><strong>Admission No.:</strong> {item?.admissionNumber || "—"}</div>
                  <div><strong>Class:</strong> {item?.classAssigned?.name || "—"}</div>
                  <div><strong>Approved:</strong> {formatDate(item?.approvedAt || item?.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Student"
          message={`Are you sure you want to delete ${item?.fullName}? This action cannot be undone and will remove the student from the database.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText="Delete Student"
          cancelText="Cancel"
        />
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Take Profile Photo</h3>
              <button
                onClick={handleCloseCamera}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            {cameraError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm whitespace-pre-line">{cameraError}</p>
              </div>
            ) : (
              <>
                <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ maxHeight: '480px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect for better user experience
                  />
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleTakePhoto}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    📷 Take Photo
                  </button>
                  <button
                    onClick={handleCloseCamera}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="mt-4 text-center text-xs text-slate-500">
                  Position your face in the camera and click "Take Photo"
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
