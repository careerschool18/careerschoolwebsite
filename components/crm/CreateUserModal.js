import React, { useState } from "react";
import { crmApi } from "../../lib/crmApi";
import { ROLES } from "../../lib/crmAuth";

/**
 * Create a CRM account (username + password + role). Super admin can pick Admin or
 * Employee; an admin is restricted to Employee only (the role dropdown is locked).
 * On success the parent refreshes the list. Username is the only name stored/shown.
 */
export default function CreateUserModal({ open, onClose, onCreated, canCreateAdmin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: ROLES.EMPLOYEE,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setError("");
    if (!form.username.trim() || !form.password) {
      setError("Username and password are required.");
      return;
    }
    setBusy(true);
    try {
      await crmApi.createUser({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
      });
      setForm({ username: "", password: "", role: ROLES.EMPLOYEE });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-800">Create Account</h3>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Username</span>
            <input
              className={inputCls}
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Password</span>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Role</span>
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              disabled={!canCreateAdmin}
            >
              <option value={ROLES.EMPLOYEE}>Employee</option>
              {canCreateAdmin && <option value={ROLES.ADMIN}>Admin</option>}
            </select>
            {!canCreateAdmin && (
              <span className="text-xs text-gray-400 mt-1 block">Admins can create employees only.</span>
            )}
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-sm disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
