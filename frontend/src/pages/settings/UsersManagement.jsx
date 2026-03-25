import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "../../components/common/Icons";
import { useAuth } from "../../context/AuthContext";
import * as adminService from "../../services/adminService";
import { verifyMfa, resendOtp } from "../../services/mfaService";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { roleHomePath } from "../../utils/helpers";

export default function UsersManagement() {
  const [rows, setRows] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { role } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { 
      name: "", 
      email: "", 
      password: "", 
      role: "teacher", 
      mfa_enabled: false 
    },
  });
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching users list...");
        console.log("Calling adminService for role:", role);
        
        // Use appropriate endpoint based on role
        const data = role === "admin" 
          ? await adminService.listUsers()
          : await adminService.listAllUsers();
          
        console.log("Users data received:", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data keys:", Object.keys(data || {}));
        
        const usersArray = Array.isArray(data) ? data : data.users || data.items || [];
        console.log("Final users array:", usersArray);
        setRows(usersArray);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        alert("Failed to load users. Check backend permissions.");
      }
    };
    
    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  // MFA verification functions
  const handleMfaVerification = async () => {
    if (!mfaOtp || mfaOtp.length !== 6) {
      setMfaError("Please enter a valid 6-digit OTP");
      return;
    }
    
    try {
      setIsVerifyingMfa(true);
      setMfaError("");
      
      // Call MFA verification API
      const result = await verifyMfa(mfaEmail, mfaOtp);
      
      if (result.success) {
        setShowMfaModal(false);
        setMfaOtp("");
        setMfaEmail("");
        alert('MFA verified successfully!');
        // Redirect to dashboard based on role
        window.location.href = roleHomePath(role);
      } else {
        setMfaError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      setMfaError('Verification failed. Please try again.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };
  
  const handleMfaResend = async () => {
    try {
      // Call resend OTP API
      const result = await resendOtp(mfaEmail);
      
      if (result.success) {
        alert('OTP resent to your email!');
      } else {
        setMfaError('Failed to resend OTP');
      }
    } catch (error) {
      setMfaError('Failed to resend OTP. Please try again.');
    }
  };
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { isSubmitting: isSubmittingEdit },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      mfa_enabled: false,
    },
  });

  useEffect(() => {
    let ignore = false;
    (async () => {
      console.log("UsersManagement useEffect - role:", role);
      try {
        const normalizedRole = role?.toUpperCase();
        console.log("UsersManagement useEffect - normalizedRole:", normalizedRole);
        
        if (normalizedRole !== "ADMIN" && normalizedRole !== "HEADTEACHER") {
          console.log("Access denied - role not admin or headteacher");
          if (!ignore) setRows([]);
          return;
        }
        console.log("Access granted - users will be loaded when created");
        // Removed automatic GET request - users will be loaded only when created
        if (!ignore) setRows([]);
      } catch {
        console.log("Error initializing users management");
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

  const columns = useMemo(
    () => [
      { key: "name", header: "User" },
      { key: "role", header: "Role" },
      {
        key: "twoFA",
        header: "2FA",
        render: (r) => (
          <Badge tone={r.twoFactorEnabled ? "success" : "neutral"}>
            {r.twoFactorEnabled ? "Enabled" : "Off"}
          </Badge>
        ),
      },
      {
        key: "active",
        header: "Status",
        render: (r) => (
          <Badge tone={r.isActive ? "success" : "danger"}>{r.isActive ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) =>
          role === "admin" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => {
                setEditingUser(r);
                setEditValues({
                  name: r.name || "",
                  email: r.email || "",
                  password: "",
                  role: r.role || "teacher",
                  twoFA: Boolean(r.mfa_enabled || r.twoFactorEnabled),
                  isActive: Boolean(r.isActive !== false),
                });
                setIsEditOpen(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
              onClick={async () => {
                if (window.confirm(`Enable 2FA for ${r.name}?`)) {
                  try {
                    await adminService.updateUser(r._id || r.id, { twoFactorEnabled: true });
                    const data = role === "admin" 
                      ? await adminService.listUsers()
                      : await adminService.listAllUsers();
                    setRows(Array.isArray(data) ? data : data.users || data.items || []);
                    alert("2FA enabled!");
                  } catch {
                    alert("Failed to enable 2FA.");
                  }
                }
              }}
            >
              Toggle 2FA
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete user "${r.name}"? This action cannot be undone.`)) {
                  try {
                    await adminService.deleteUser(r._id || r.id);
                    const data = role === "admin" 
                      ? await adminService.listUsers()
                      : await adminService.listAllUsers();
                    setRows(Array.isArray(data) ? data : data.users || data.items || []);
                    alert('User deleted successfully!');
                  } catch {
                    alert("Delete failed. Check backend permissions.");
                  }
                }
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-medium">Admin Only</span>
        ),
      },
    ],
    [role]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Manage Users" subtitle="Create users, assign roles, enable 2FA, and delete accounts." />
      
      <div className="mb-4">
        <button
          onClick={async () => {
            try {
              // Use appropriate endpoint based on role
              const data = role === "admin" 
                ? await adminService.listUsers()
                : await adminService.listAllUsers();
              setRows(Array.isArray(data) ? data : data.users || data.items || []);
              alert('Users list refreshed!');
            } catch (error) {
              console.error('Failed to refresh users:', error);
              alert('Failed to refresh users list');
            }
          }}
          className="inline-flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Refresh Users List
        </button>
      </div>

      {role?.toLowerCase() !== "admin" && role?.toLowerCase() !== "headteacher" ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            This page is available to Admin (manage) and Headteacher (view).
          </div>
        </Panel>
      ) : null}

      {role?.toLowerCase() === "admin" ? (
      <Panel className="p-5">
        <div className="font-display text-lg font-semibold text-slate-900">Create user</div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-3"
          onSubmit={handleSubmit(async (values) => {
            try {
              console.log("Creating user with data:", {
                name: values.name,
                email: values.email,
                role: values.role,
                mfa_enabled: values.mfa_enabled,
              });
              
              const result = await adminService.createUser({
                name: values.name,
                email: values.email,
                password: values.password,
                role: values.role,
                mfa_enabled: values.mfa_enabled,
              });
              
              console.log("User created successfully:", result);
              console.log("Result structure:", Object.keys(result));
              console.log("User data:", result.user || result.data || result);
              
              // Don't fetch users list - just add the new user to the table
              const newUser = result.user || result.data || result;
              if (newUser) {
                setRows(prevRows => [...prevRows, newUser]);
              } else {
                console.error("No user data found in response");
                // If we can't add locally, fetch the updated list
                try {
                  const data = await adminService.listUsers();
                  setRows(Array.isArray(data) ? data : data.items || []);
                } catch (fetchError) {
                  console.error("Failed to fetch users after creation:", fetchError);
                }
              }
              reset();
            } catch (error) {
              console.error("Create user error:", error);
              console.error("Error response:", error.response?.data);
              console.error("Error status:", error.response?.status);
              console.error("Error message:", error.response?.data?.message);
              
              // Check if it's an authentication issue
              if (error.response?.status === 403) {
                console.error("Authentication issue detected!");
                console.error("Current token:", localStorage.getItem("aas_token")?.substring(0, 50) + "...");
                console.error("Current user role:", role);
                console.error("Current user data:", JSON.parse(localStorage.getItem("aas_user") || "null"));
              }
              
              alert(`Create user failed: ${error.response?.data?.message || "Admin role required."}`);
            }
          })}
        >
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-800">Name</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("name", { required: true })}
              placeholder="Full name"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-800">Email</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("email", { required: true })}
              placeholder="john@example.com"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-800">Role</label>
            <select
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("role", { required: true })}
            >
              <option value="admin">Admin</option>
              <option value="headteacher">Headteacher</option>
              <option value="assistant_headteacher">Assistant Headteacher</option>
              <option value="teacher">Class Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-800">Temporary Password</label>
            <div className="relative mt-1">
              <input
                type={showCreatePassword ? "text" : "password"}
                className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 pr-10 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                {...register("password", { required: true })}
                placeholder="Set an initial password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowCreatePassword(!showCreatePassword)}
              >
                {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="md:col-span-1 flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" {...register("mfa_enabled")} />
              Enable MFA
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Panel>
      ) : null}

      {/* MFA Verification Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">MFA Verification</h2>
              <button
                onClick={() => setShowMfaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={mfaEmail}
                  onChange={(e) => setMfaEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Enter your email"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">OTP Code</label>
                <input
                  type="text"
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              
              {mfaError && (
                <div className="text-red-500 text-sm mt-2">{mfaError}</div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleMfaVerification}
                  disabled={isVerifyingMfa}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isVerifyingMfa ? 'Verifying...' : 'Verify OTP'}
                </button>
                
                <button
                  onClick={handleMfaResend}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {role?.toLowerCase() !== "admin" && role?.toLowerCase() !== "headteacher" ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            This page is available to Admin (manage) and Headteacher (view).
          </div>
        </Panel>
      ) : null}

      <Table title="Users" rows={rows} columns={columns} searchable={true} />

      <Modal
        open={isEditOpen}
        title={editingUser ? `Edit user: ${editingUser.name || editingUser.username}` : "Edit user"}
        onClose={() => setIsEditOpen(false)}
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleEditSubmit(async (values) => {
            if (!editingUser) return;
            try {
              const payload = {
                name: values.name,
                username: values.username,
                email: values.email || undefined,
                role: values.role,
                twoFactorEnabled: Boolean(values.twoFA),
                isActive: Boolean(values.isActive),
              };
              if (values.password) payload.password = values.password;
              await adminService.updateUser(editingUser._id || editingUser.id, payload);
              const data = role === "admin" 
                ? await adminService.listUsers()
                : await adminService.listAllUsers();
              setRows(Array.isArray(data) ? data : data.users || data.items || []);
              setIsEditOpen(false);
            } catch {
              alert("Update failed. Check backend permissions.");
            }
          })}
        >
          <div>
            <label className="text-sm font-semibold text-slate-800">Name</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...registerEdit("name", { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Username</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...registerEdit("username", { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Email</label>
            <input
              type="email"
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...registerEdit("email")}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Role</label>
            <select
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...registerEdit("role", { required: true })}
            >
              <option value="admin">Admin</option>
              <option value="headteacher">Headteacher</option>
              <option value="assistantHeadteacher">Assistant Headteacher</option>
              <option value="teacher">Class Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Temporary Password</label>
            <div className="relative mt-1">
              <input
                type={showEditPassword ? "text" : "password"}
                className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 pr-10 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                {...registerEdit("password")}
                placeholder="Leave blank to keep current" 
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowEditPassword(!showEditPassword)}
              >
                {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" {...registerEdit("twoFA")} />
              2FA
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" {...registerEdit("isActive")} />
              Active
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-6 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            >
              {isSubmittingEdit ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
