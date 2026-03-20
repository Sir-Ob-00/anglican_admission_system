import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import * as userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function UsersManagement() {
  const [rows, setRows] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { role } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: "", username: "", password: "", role: "parent", twoFA: false },
  });
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { isSubmitting: isSubmittingEdit },
  } = useForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      role: "parent",
      password: "",
      twoFA: false,
      isActive: true,
    },
  });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (role !== "admin" && role !== "headteacher") {
          if (!ignore) setRows([]);
          return;
        }
        const data = await userService.listUsers();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
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
          <Badge tone={r.isActive ? "success" : "danger"}>{r.isActive ? "Active" : "Deactivated"}</Badge>
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
                resetEdit({
                  name: r.name || "",
                  username: r.username || "",
                  email: r.email || "",
                  role: r.role || "parent",
                  password: "",
                  twoFA: Boolean(r.twoFactorEnabled),
                  isActive: Boolean(r.isActive),
                });
                setIsEditOpen(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={async () => {
                try {
                  await userService.updateUser(r._id || r.id, { twoFactorEnabled: !r.twoFactorEnabled });
                  const data = await userService.listUsers();
                  setRows(Array.isArray(data) ? data : data.items || []);
                } catch {
                  alert("Update failed. Check backend permissions.");
                }
              }}
            >
              Toggle 2FA
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
              onClick={async () => {
                try {
                  await userService.deactivateUser(r._id || r.id);
                  const data = await userService.listUsers();
                  setRows(Array.isArray(data) ? data : data.items || []);
                } catch {
                  alert("Deactivate failed. Check backend permissions.");
                }
              }}
            >
              Deactivate
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">View only</span>
        ),
      },
    ],
    [role]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Manage Users" subtitle="Create users, assign roles, enable 2FA, and deactivate accounts." />

      {role !== "admin" && role !== "headteacher" ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            This page is available to Admin (manage) and Headteacher (view).
          </div>
        </Panel>
      ) : null}

      {role === "admin" ? (
      <Panel className="p-5">
        <div className="font-display text-lg font-semibold text-slate-900">Create user</div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-3"
          onSubmit={handleSubmit(async (values) => {
            try {
              await userService.createUser({
                name: values.name,
                username: values.username,
                password: values.password,
                role: values.role,
                twoFactorEnabled: values.twoFA,
              });
              const data = await userService.listUsers();
              setRows(Array.isArray(data) ? data : data.items || []);
              reset();
            } catch {
              alert("Create user failed. Admin role required.");
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
            <label className="text-sm font-semibold text-slate-800">Username</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("username", { required: true })}
              placeholder="e.g., headteacher1"
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
              <option value="assistantHeadteacher">Assistant Headteacher</option>
              <option value="teacher">Class Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-800">Temporary Password</label>
            <input
              type="password"
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("password", { required: true })}
              placeholder="Set an initial password"
            />
          </div>
          <div className="md:col-span-1 flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" {...register("twoFA")} />
              Enable 2FA
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
      ) : (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Users</div>
          <div className="mt-2 text-sm text-slate-600">
            Headteacher can view system users and roles, but cannot modify users.
          </div>
        </Panel>
      )}

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
              await userService.updateUser(editingUser._id || editingUser.id, payload);
              const data = await userService.listUsers();
              setRows(Array.isArray(data) ? data : data.items || []);
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
            <input
              type="password"
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...registerEdit("password")}
              placeholder="Leave blank to keep current" 
            />
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
