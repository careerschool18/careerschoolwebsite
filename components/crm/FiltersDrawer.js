import React from "react";

/**
 * Right-side filter drawer — text fields by default, dropdowns when the field defines
 * `type: 'select'` + `options`. Channel / Training Mode / Status / Assigned To use
 * dropdowns; the rest stay text. Draft state → Apply commits.
 */
export default function FiltersDrawer({
  open,
  fields,
  draft,
  activeCount,
  onDraftChange,
  onApply,
  onReset,
  onClose,
}) {
  if (!open) return null;

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-blue-800">Filters</h3>
            {activeCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeCount} active
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                {field.label}
              </span>
              {field.type === "select" ? (
                <select
                  value={draft[field.key] || ""}
                  onChange={(e) => onDraftChange(field.key, e.target.value)}
                  className={inputClass}
                >
                  <option value="">All</option>
                  {(field.options || []).map((opt) => {
                    const value = typeof opt === "string" ? opt : opt.value;
                    const label = typeof opt === "string" ? opt : opt.label;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  autoComplete="off"
                  value={draft[field.key] || ""}
                  onChange={(e) => onDraftChange(field.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onApply();
                  }}
                  placeholder={`Filter by ${field.label}`}
                  className={inputClass}
                />
              )}
            </label>
          ))}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t">
          <button
            onClick={onReset}
            className="flex-1 border-2 border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm font-semibold"
          >
            Reset / Clear All
          </button>
          <button
            onClick={onApply}
            className="flex-1 bg-blue-700 text-white rounded-xl py-2.5 text-sm font-bold"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}
