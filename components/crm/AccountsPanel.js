import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { crmApi } from "../../lib/crmApi";
import { getUser, ROLES } from "../../lib/crmAuth";
import ConfirmDialog from "./ConfirmDialog";
import CreateUserModal from "./CreateUserModal";

/**
 * Accounts panel ("My Team"). Super admin sees all accounts + create/delete; admin sees
 * active employees and other admins + create-employee. Has a Back button to return to the
 * leads dashboard of the respective role. Delete (super admin only) removes the account
 * permanently.
 */
export default function AccountsPanel() {
  const router = useRouter();
  const user = getUser() || {};
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Pending destructive action: { kind: 'delete', account }
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await crmApi.listUsers();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load accounts");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto silent refresh every 5s — pauses while typing in any text field/textarea/select,
  // while a modal/confirm is open, or while the tab is hidden. Silent: no spinner, errors
  // swallowed, and focus stays where the user left it (no remount — same object kept when
  // content is unchanged).
  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "textarea" || tag === "select") return true;
      if (tag !== "input") return false;
      return !["button", "checkbox", "radio", "submit", "file", "hidden"].includes(
        (el.type || "text").toLowerCase(),
      );
    };
    const id = setInterval(async () => {
      if (document.hidden || showCreate || action) return;
      const el = document.activeElement;
      if (isTypingTarget(el)) return;
      try {
        const fresh = await crmApi.listUsers();
        if (!Array.isArray(fresh)) return;
        setAccounts((prev) => {
          const prevById = new Map(prev.map((a) => [a.id, a]));
          return fresh.map((row) => {
            const old = prevById.get(row.id);
            if (old && JSON.stringify(old) === JSON.stringify(row)) return old;
            return row;
          });
        });
      } catch {
        // Silent — never surface auto-refresh errors.
      }
    }, 5000);
    return () => clearInterval(id);
  }, [showCreate, action]);

  const runAction = async () => {
    if (!action) return;
    setBusy(true);
    try {
      await crmApi.deleteUser(action.account.id);
      setAction(null);
      await load();
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const roleBadge = () => "bg-blue-100 text-blue-700";

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/crm/leads")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-bold"
          >
            &larr; Back
          </button>
          <h2 className="text-2xl font-bold text-blue-800">My Team</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {accounts.length} Accounts
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-4 py-2 text-sm font-bold"
        >
          + Create Account
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>
      )}

      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-700 text-white text-left">
              <th className="px-3 py-3 font-semibold">ID</th>
              <th className="px-3 py-3 font-semibold">Username</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const isSelf = account.id === user.id;
                return (
                  <tr key={account.id} className="border-t hover:bg-blue-50/50">
                    <td className="px-3 py-2">{account.id}</td>
                    <td className="px-3 py-2 font-medium">{account.username}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge(account.role)}`}
                      >
                        {account.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        {isSuperAdmin && !isSelf && (
                          <button
                            onClick={() => setAction({ kind: "delete", account })}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
        canCreateAdmin={isSuperAdmin}
      />

      <ConfirmDialog
        open={Boolean(action)}
        title="Delete account permanently?"
        message={`This permanently deletes ${action?.account.username}. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={busy}
        onConfirm={runAction}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
