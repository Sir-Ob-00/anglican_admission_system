import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import { listParents, createParent, updateParent } from "../../services/parentService";
import { listUsers } from "../../services/userService";

export default function ParentsList() {
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { role } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { phone: "", address: "" } });

  async function refresh() {
    const [parentsRes, usersRes] = await Promise.all([listParents(), listUsers({ role: "parent" })]);
    const parentItems = Array.isArray(parentsRes) ? parentsRes : parentsRes.items || [];
    const userItems = Array.isArray(usersRes) ? usersRes : usersRes.items || [];
    setProfiles(parentItems);
    const profileByUser = new Map(parentItems.map((p) => [String(p.user?._id || p.user), p]));
    const merged = userItems.map((u) => ({
      id: u._id || u.id,
      name: u.name || u.username,
      username: u.username,
      email: u.email,
      user: u,
      profile: profileByUser.get(String(u._id || u.id)) || null,
    }));
    setRows(merged);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (role !== "admin" && role !== "headteacher" && role !== "assistantHeadteacher") {
          if (!ignore) setRows([]);
          return;
        }
        await refresh();
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
      { key: "name", header: "Parent", render: (r) => r.name || r.user?.name || "—" },
      { key: "username", header: "Username", render: (r) => r.username || r.user?.username || "—" },
      { key: "phone", header: "Phone", render: (r) => r.profile?.phone || "—" },
      { key: "profile", header: "Profile", render: (r) => (r.profile ? "Complete" : "Missing") },
      {
        key: "actions",
        header: "Actions",
        render: (r) =>
          role === "admin" || role === "headteacher" ? (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
              onClick={() => {
                setEditing(r);
                reset({
                  phone: r.profile?.phone || "",
                  address: r.profile?.address || "",
                });
                setIsOpen(true);
              }}
            >
              {r.profile ? "Edit Info" : "Add Info"}
            </button>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          ),
      },
    ],
    [role, reset]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Parents" subtitle="Parent directory and profile information." />
      {role !== "admin" && role !== "headteacher" && role !== "assistantHeadteacher" ? (
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Access denied.</div>
        </Panel>
      ) : null}
      <Table title="Parents List" rows={rows} columns={columns} />

      <Modal
        open={isOpen}
        title={editing?.profile ? "Edit Parent Info" : "Add Parent Info"}
        onClose={() => setIsOpen(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            if (!editing?.id) return;
            try {
              if (editing.profile?._id) {
                await updateParent(editing.profile._id, {
                  phone: values.phone,
                  address: values.address,
                });
              } else {
                await createParent({
                  user: editing.id,
                  phone: values.phone,
                  address: values.address,
                });
              }
              await refresh();
              setIsOpen(false);
            } catch {
              alert("Save failed. Ensure you have permission.");
            }
          })}
        >
          <div>
            <label className="text-sm font-semibold text-slate-800">Phone</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("phone")}
              placeholder="e.g., +233..."
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Address</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("address")}
              placeholder="Residential address"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
