import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { crmApi } from "../../lib/crmApi";
import { getUser, ROLES } from "../../lib/crmAuth";
import {
  LEAD_COLUMNS,
  STATUS_OPTIONS,
  CHANNEL_OPTIONS,
  TRAINING_MODE_OPTIONS,
  formatTimestamp,
} from "../../lib/crmConstants";
import AddLeadModal from "./AddLeadModal";
import FiltersDrawer from "./FiltersDrawer";
import AssignLeadModal from "./AssignLeadModal";
import ConfirmDialog from "./ConfirmDialog";

/**
 * The shared leads table used by all three roles. Role decides what's visible:
 * - Super admin: Assign + per-row Delete.
 * - Admin: Assign (no Delete).
 * - Employee: only their assigned leads (server-scoped), Add + Filters + Status/Remarks.
 * Add (single/bulk) and Filters are shown to everyone.
 */
export default function LeadsPanel() {
  const user = getUser() || {};
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const canAssign = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN;

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);

  // Filters (drawer + applied state)
  // Channel / Training Mode / Status are dropdowns using the same option values the
  // table cells show; Assigned To is a dropdown of active employees (auto-updates when
  // a new employee is created — reloaded every time the drawer opens).
  const SELECT_KEYS = useMemo(
    () => new Set(["channel", "trainingMode", "status", "assignedToName"]),
    [],
  );
  const [employees, setEmployees] = useState([]);
  const filterFields = useMemo(() => {
    // Employees see only their own leads, so Assigned To needs no dropdown — derive the
    // single option from their own rows; managers get the live active-employee list.
    const assignedOptions = canAssign
      ? employees.map((emp) => ({
          value: emp.username,
          label: emp.username,
        }))
      : [];
    return LEAD_COLUMNS.filter((c) => c.key !== "id").map((c) => {
      if (c.key === "channel") return { ...c, type: "select", options: CHANNEL_OPTIONS };
      if (c.key === "trainingMode")
        return { ...c, type: "select", options: TRAINING_MODE_OPTIONS };
      if (c.key === "status") return { ...c, type: "select", options: STATUS_OPTIONS };
      if (c.key === "assignedToName") {
        if (!canAssign) return { ...c }; // employee: keep text filter, no employee list API
        return { ...c, type: "select", options: assignedOptions };
      }
      return { ...c };
    });
  }, [employees, canAssign]);
  const emptyFilters = useMemo(
    () => Object.fromEntries(filterFields.map((f) => [f.key, ""])),
    [filterFields],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [searchTerm, setSearchTerm] = useState("");

  // Assign + delete targets
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Inline tracking save feedback: { [rowKey:field]: 'saving'|'saved'|'error' }
  const [tracking, setTracking] = useState({});

  const loadLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await crmApi.listLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load leads");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Pause-flag: true while the user is typing in a text field/textarea/select anywhere
  // (search box, filter drawer, table remarks) or has a modal open — silent refresh waits.
  const pausedRef = useRef(false);
  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "textarea" || tag === "select") return true;
      if (tag !== "input") return false;
      const type = (el.type || "text").toLowerCase();
      return !["button", "checkbox", "radio", "submit", "file", "hidden"].includes(type);
    };
    const activeIsTyping = () => {
      const el = document.activeElement;
      if (isTypingTarget(el)) return true;
      // Keep focus exactly where the user left it across silent refreshes is handled by
      // ref-merge below; here we also pause while a modal/drawer overlay is open.
      return Boolean(document.querySelector("[data-crm-modal-open='true']"));
    };
    const onFocusIn = (e) => {
      if (isTypingTarget(e.target)) pausedRef.current = true;
    };
    const onFocusOut = () => {
      setTimeout(() => {
        if (!activeIsTyping()) pausedRef.current = false;
      }, 300);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Auto silent refresh every 5s — skips while typing/modal open. Merges by row key so
  // React keeps DOM nodes (no remount → no focus jump, no visible reload flash), and
  // never overwrites a row the user is actively editing (tracked in editingKeysRef).
  const editingKeysRef = useRef(new Set());
  useEffect(() => {
    const id = setInterval(async () => {
      if (pausedRef.current || document.hidden) return;
      if (showAdd || showFilters || assignTarget || deleteTarget) return;
      try {
        const fresh = await crmApi.listLeads();
        if (!Array.isArray(fresh)) return;
        setLeads((prev) => {
          const prevByKey = new Map(prev.map((l) => [`${l.type}:${l.id}`, l]));
          return fresh.map((row) => {
            const key = `${row.type}:${row.id}`;
            const old = prevByKey.get(key);
            // Keep the row the user is editing (status/remarks focus) untouched.
            if (editingKeysRef.current.has(`${key}:status`) || editingKeysRef.current.has(`${key}:remarks`)) {
              return old || row;
            }
            // Same content → keep old object reference so React skips re-render of that row.
            if (old && JSON.stringify(old) === JSON.stringify(row)) return old;
            return row;
          });
        });
      } catch {
        // Silent — never surface auto-refresh errors.
      }
    }, 5000);
    return () => clearInterval(id);
  }, [showAdd, showFilters, assignTarget, deleteTarget]);

  const activeFilterCount = useMemo(
    () => Object.values(activeFilters).filter((v) => v.trim() !== "").length,
    [activeFilters],
  );

  // Client-side filtering across all columns + a universal search term.
  // Dropdown filters (channel / training mode / status / assigned-to) use exact match;
  // text filters use contains-match.
  const visibleLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return leads.filter((lead) => {
      for (const [key, needle] of Object.entries(activeFilters)) {
        if (!needle.trim()) continue;
        const value = (lead[key] ?? "").toString();
        if (SELECT_KEYS.has(key)) {
          if (value.toLowerCase() !== needle.trim().toLowerCase()) return false;
        } else if (!value.toLowerCase().includes(needle.trim().toLowerCase())) {
          return false;
        }
      }
      if (term) {
        const haystack = [
          lead.fullName,
          lead.email,
          lead.whatsappNumber,
          lead.city,
          lead.state,
          lead.course,
          lead.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [leads, activeFilters, searchTerm]);

  const applyFilters = () => {
    setActiveFilters({ ...draftFilters });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setDraftFilters({ ...emptyFilters });
    setActiveFilters({ ...emptyFilters });
  };

  // Save a Status or Remarks edit against one row; optimistic-friendly feedback per cell.
  const saveTracking = async (lead, field, value) => {
    const key = `${lead.type}:${lead.id}:${field}`;
    const previous = lead[field];
    setTracking((prev) => ({ ...prev, [key]: "saving" }));
    setLeads((prev) => prev.map((l) => (l.id === lead.id && l.type === lead.type ? { ...l, [field]: value } : l)));
    try {
      await crmApi.updateTracking(lead.type, lead.id, { [field]: value });
      setTracking((prev) => ({ ...prev, [key]: "saved" }));
      setTimeout(() => setTracking((prev) => ({ ...prev, [key]: "" })), 2000);
    } catch (err) {
      // Roll back on failure.
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id && l.type === lead.type ? { ...l, [field]: previous } : l)),
      );
      setTracking((prev) => ({ ...prev, [key]: "error" }));
      console.error("Tracking save failed:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await crmApi.deleteLead(deleteTarget.type, deleteTarget.id);
      setLeads((prev) =>
        prev.filter((l) => !(l.id === deleteTarget.id && l.type === deleteTarget.type)),
      );
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setActionBusy(false);
    }
  };

  const renderStatusCell = (lead) => {
    const key = `${lead.type}:${lead.id}:status`;
    const state = tracking[key];
    return (
      <div className="flex flex-col gap-0.5 min-w-[150px]">
        <select
          value={lead.status || "Invited"}
          onFocus={() => editingKeysRef.current.add(key)}
          onBlur={() => editingKeysRef.current.delete(key)}
          onChange={(e) => saveTracking(lead, "status", e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {state && (
          <span className={`text-[11px] ${state === "error" ? "text-red-600" : "text-green-600"}`}>
            {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : "Error"}
          </span>
        )}
      </div>
    );
  };

  const renderRemarksCell = (lead) => {
    const key = `${lead.type}:${lead.id}:remarks`;
    const state = tracking[key];
    return (
      <div className="flex flex-col gap-0.5 min-w-[180px]">
        <textarea
          rows={2}
          defaultValue={lead.remarks || ""}
          placeholder="Add remark..."
          onFocus={() => editingKeysRef.current.add(key)}
          onBlur={(e) => {
            editingKeysRef.current.delete(key);
            if (e.target.value !== (lead.remarks || "")) saveTracking(lead, "remarks", e.target.value);
          }}
          className="border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[52px]"
        />
        {state && (
          <span className={`text-[11px] ${state === "error" ? "text-red-600" : "text-green-600"}`}>
            {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : "Error"}
          </span>
        )}
      </div>
    );
  };

  const columns = [...LEAD_COLUMNS];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-blue-800">Leads</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            {visibleLeads.length}
            {activeFilterCount || searchTerm ? ` of ${leads.length}` : ""} Leads
          </span>
          {user.role === ROLES.EMPLOYEE && (
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
              Assigned to you
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search name, email, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm outline-none w-full sm:w-64"
          />
          <button
            onClick={() => {
              setDraftFilters({ ...activeFilters });
              // Refresh the employee list so the Assigned To dropdown includes
              // newly created employees (admin/super-admin only endpoint).
              if (canAssign) {
                crmApi
                  .activeEmployees()
                  .then((list) => setEmployees(Array.isArray(list) ? list : []))
                  .catch(() => {});
              }
              setShowFilters(true);
            }}
            className="flex items-center gap-1 border-2 border-blue-400 text-blue-700 hover:bg-blue-50 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-4 py-2 text-sm font-bold"
          >
            + Add
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-700 text-white text-left">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-3 font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-500">
                  Loading leads...
                </td>
              </tr>
            ) : visibleLeads.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-500">
                  {leads.length === 0 ? "No leads yet." : "No leads match your filters."}
                </td>
              </tr>
            ) : (
              visibleLeads.map((lead) => (
                <tr key={`${lead.type}:${lead.id}`} className="border-t hover:bg-blue-50/50 align-top">
                  {columns.map((col) => {
                    if (col.key === "status") {
                      return (
                        <td key="status" className="px-3 py-2">
                          {renderStatusCell(lead)}
                        </td>
                      );
                    }
                    if (col.key === "remarks") {
                      return (
                        <td key="remarks" className="px-3 py-2">
                          {renderRemarksCell(lead)}
                        </td>
                      );
                    }
                    if (col.key === "createdAt") {
                      return (
                        <td key="createdAt" className="px-3 py-2 whitespace-nowrap">
                          {formatTimestamp(lead.createdAt)}
                        </td>
                      );
                    }
                    const value = lead[col.key];
                    return (
                      <td key={col.key} className="px-3 py-2">
                        {value === null || value === undefined || value === "" ? "—" : String(value)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {canAssign && (
                        <button
                          onClick={() => setAssignTarget(lead)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg"
                        >
                          Assign
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeleteTarget(lead)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg"
                        >
                          Delete
                        </button>
                      )}
                      {!canAssign && !isSuperAdmin && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddLeadModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => loadLeads(true)} />

      <FiltersDrawer
        open={showFilters}
        fields={filterFields}
        draft={draftFilters}
        activeCount={activeFilterCount}
        onDraftChange={(key, value) => setDraftFilters((prev) => ({ ...prev, [key]: value }))}
        onApply={applyFilters}
        onReset={resetFilters}
        onClose={() => setShowFilters(false)}
      />

      <AssignLeadModal
        open={Boolean(assignTarget)}
        lead={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => loadLeads(true)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete lead permanently?"
        message={`This will permanently remove ${deleteTarget?.fullName || "this lead"} (ID ${deleteTarget?.id}) from the database. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={actionBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
