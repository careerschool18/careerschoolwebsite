import React, { useEffect, useState } from "react";
import { crmApi } from "../../lib/crmApi";

/**
 * Assign a lead to an active employee. Loads the employee list from
 * /api/crm/users/employees/active (so newly created employees appear immediately).
 * Super admin + admin only.
 */
export default function AssignLeadModal({ open, lead, onClose, onAssigned }) {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoading(true);
    setSelected(lead && lead.assignedToId ? String(lead.assignedToId) : "");
    crmApi
      .activeEmployees()
      .then((list) => setEmployees(list || []))
      .catch((err) => setError(err.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }, [open, lead]);

  if (!open) return null;

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      await crmApi.assignLead(lead.type, lead.id, selected ? Number(selected) : null);
      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      setError(err.message || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-1">Assign Lead</h3>
        <p className="text-sm text-gray-500 mb-4">
          {lead ? `${lead.fullName || "Lead"} (ID ${lead.id})` : ""}
        </p>

        {error && (
          <div className="mb-3 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 mb-4">Loading employees...</p>
        ) : (
          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
              Assign to employee
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- Unassigned -</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.username}
                </option>
              ))}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No active employees yet. Create an employee account first.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || loading}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-sm disabled:opacity-60"
          >
            {busy ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
