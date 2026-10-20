import React, { useMemo, useState } from "react";
import { State, City } from "country-state-city";
import {
  STATUS_OPTIONS,
  EXPERIENCE_OPTIONS,
  TRAINING_MODE_OPTIONS,
  SOURCE_OPTIONS,
} from "../../lib/crmConstants";

/**
 * Add-lead modal with two tabs: Single entry and Bulk entries. Posts through the CRM API
 * (single → /leads, bulk → /leads/bulk). Used by all three roles since everyone can add leads.
 *
 * Drop-downs mirror /training-enquiry-form: State → City (country-state-city, India),
 * Experience (same values), Training Mode (ONLINE/OFFLINE), Course + Source (same values),
 * Status (full backend list). Remarks is a textarea.
 */

const EMPTY_ROW = {
  fullName: "",
  email: "",
  whatsappNumber: "",
  countryCode: "+91",
  enquiryType: "",
  degree: "",
  currentEmployer: "",
  specialization: "",
  state: "",
  city: "",
  totalExperience: "",
  trainingMode: "",
  courseName: "",
  preferredRole: "",
  source: "",
  status: "Invited",
  remarks: "",
};

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

const selectClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function RemarksField({ label, value, onChange }) {
  return (
    <label className="block col-span-2 md:col-span-3">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </span>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add remarks..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[52px]"
      />
    </label>
  );
}

export default function AddLeadModal({ open, onClose, onSaved }) {
  const [mode, setMode] = useState("single");
  const [single, setSingle] = useState({ ...EMPTY_ROW });
  const [bulk, setBulk] = useState([{ ...EMPTY_ROW }]);
  const [hint, setHint] = useState(null); // { type: 'ok'|'error', text }
  const [saving, setSaving] = useState(false);

  // Same India states list as /training-enquiry-form (country-state-city).
  const stateOptions = useMemo(
    () =>
      State.getStatesOfCountry("IN").map((s) => ({
        label: s.name,
        value: s.isoCode,
      })),
    [],
  );
  const citiesFor = (isoCode) => {
    if (!isoCode) return [];
    try {
      return City.getCitiesOfState("IN", isoCode).map((c) => ({
        label: c.name,
        value: c.name,
      }));
    } catch {
      return [];
    }
  };

  const reset = () => {
    setSingle({ ...EMPTY_ROW });
    setBulk([{ ...EMPTY_ROW }]);
    setHint(null);
    setMode("single");
  };

  const close = () => {
    reset();
    onClose();
  };

  const setSingleField = (key, value) => setSingle((prev) => ({ ...prev, [key]: value }));
  const setBulkField = (index, key, value) =>
    setBulk((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  // Drop empty optional rows; require at least one identifying field on each kept row.
  const buildPayloads = (rows) =>
    rows.filter(
      (r) => r.fullName.trim() !== "" || r.email.trim() !== "" || r.whatsappNumber.trim() !== "",
    );

  const save = async () => {
    setHint(null);
    const { crmApi } = await import("../../lib/crmApi");

    let payload;
    if (mode === "single") {
      if (!single.fullName.trim()) {
        setHint({ type: "error", text: "Full Name is required." });
        return;
      }
      payload = [single];
    } else {
      const rows = buildPayloads(bulk);
      if (rows.length === 0) {
        setHint({ type: "error", text: "Add at least one entry with a name, email or mobile." });
        return;
      }
      payload = rows;
    }

    setSaving(true);
    try {
      const result =
        payload.length === 1
          ? await crmApi.createLead(payload[0])
          : await crmApi.createLeadsBulk(payload);
      setHint({
        type: "ok",
        text:
          payload.length === 1
            ? "Lead saved."
            : `${result.count ?? payload.length} leads saved.`,
      });
      if (onSaved) onSaved();
      setTimeout(close, 600);
    } catch (err) {
      setHint({ type: "error", text: err.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const rowFields = (row, onChange) => {
    const onStateChange = (isoCode) => {
      onChange("state", isoCode);
      // Reset city when the state changes (same as /training-enquiry-form).
      onChange("city", "");
    };
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-crm-modal-open="true">
        <Field label="Full Name *" value={row.fullName} onChange={(v) => onChange("fullName", v)} />
        <Field label="Email" type="email" value={row.email} onChange={(v) => onChange("email", v)} />
        <Field label="Mobile" value={row.whatsappNumber} onChange={(v) => onChange("whatsappNumber", v)} />
        <Field label="Country Code" value={row.countryCode} onChange={(v) => onChange("countryCode", v)} />
        <Field label="Enquiry Type" value={row.enquiryType} onChange={(v) => onChange("enquiryType", v)} />
        <Field label="Degree" value={row.degree} onChange={(v) => onChange("degree", v)} />
        <Field label="College / Company" value={row.currentEmployer} onChange={(v) => onChange("currentEmployer", v)} />
        <Field label="Specialization" value={row.specialization} onChange={(v) => onChange("specialization", v)} />
        <Field label="Preferred Role" value={row.preferredRole} onChange={(v) => onChange("preferredRole", v)} />
        <SelectField
          label="State"
          value={row.state}
          onChange={onStateChange}
          options={stateOptions}
          placeholder="Select State"
        />
        <SelectField
          label="City"
          value={row.city}
          onChange={(v) => onChange("city", v)}
          options={citiesFor(row.state)}
          placeholder={row.state ? "Select City" : "Select State first"}
        />
        <SelectField
          label="Experience"
          value={row.totalExperience}
          onChange={(v) => onChange("totalExperience", v)}
          options={EXPERIENCE_OPTIONS}
          placeholder="Select Experience"
        />
        <SelectField
          label="Training Mode"
          value={row.trainingMode}
          onChange={(v) => onChange("trainingMode", v)}
          options={TRAINING_MODE_OPTIONS}
          placeholder="Select Mode"
        />
        <Field label="Course" value={row.courseName} onChange={(v) => onChange("courseName", v)} placeholder="Enter course" />
        <SelectField
          label="Source"
          value={row.source}
          onChange={(v) => onChange("source", v)}
          options={SOURCE_OPTIONS}
          placeholder="Select Source"
        />
        <SelectField
          label="Status"
          value={row.status}
          onChange={(v) => onChange("status", v)}
          options={STATUS_OPTIONS}
          placeholder="Select Status"
        />
        <RemarksField label="Remarks" value={row.remarks} onChange={(v) => onChange("remarks", v)} />
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-blue-800">Add Course Enquiry</h2>
            <p className="text-sm text-gray-500">Single entry or bulk entries.</p>
          </div>
          <button onClick={close} className="text-2xl text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setMode("single")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              mode === "single" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Single Entry
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              mode === "bulk" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Bulk Entries
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "single" ? (
            rowFields(single, setSingleField)
          ) : (
            <div className="space-y-4">
              {bulk.map((row, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 relative">
                  {bulk.length > 1 && (
                    <button
                      onClick={() => setBulk((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 text-xs text-red-600 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                  <div className="text-xs font-bold text-blue-700 mb-2">Entry {index + 1}</div>
                  {rowFields(row, (k, v) => setBulkField(index, k, v))}
                </div>
              ))}
              <button
                onClick={() => setBulk((prev) => [...prev, { ...EMPTY_ROW }])}
                className="w-full border-2 border-dashed border-blue-300 text-blue-700 rounded-xl py-2 text-sm font-semibold"
              >
                + Add another entry
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          {hint ? (
            <span
              className={`text-sm font-semibold ${
                hint.type === "ok" ? "text-green-600" : "text-red-600"
              }`}
            >
              {hint.text}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={close}
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
