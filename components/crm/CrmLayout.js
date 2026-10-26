import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getUser, logout, ROLES } from "../../lib/crmAuth";

/**
 * Shared shell for every CRM dashboard page: a top bar with a generic profile avatar
 * (top-right) that opens a small card with username, role (single blue badge for all
 * roles), a green "My Team" button for admin/super-admin (opens /crm/accounts), and a
 * red Sign out button. The old Accounts nav button is removed — My Team is the entry
 * point now. Also acts as a route guard.
 */
export default function CrmLayout({ title, allowedRoles, router: routerProp, children }) {
  const router = useRouter();
  const activeRouter = routerProp || router;
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const current = getUser();
    if (!current) {
      activeRouter.replace("/crm/login");
      return;
    }
    if (allowedRoles && !current.role) {
      activeRouter.replace("/crm/leads");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(current.role)) {
      activeRouter.replace("/crm/leads");
      return;
    }
    setUser(current);
    setReady(true);
  }, [activeRouter, allowedRoles]);

  // Close the profile card on outside click / Escape.
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-blue-50 flex justify-center items-center font-semibold text-blue-800">
        Loading CRM...
      </div>
    );
  }

  const canSeeTeam = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN;
  const profileName = user.username || "User";
  const roleLabel = (user.role || "").replace("_", " ");

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-blue-700 text-white font-black text-sm px-2.5 py-1.5 rounded-lg">
              CRM
            </span>
            <span className="font-bold text-gray-800 hidden sm:block">{title}</span>
          </div>

          {/* Profile avatar (top-right) + dropdown card */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Open profile menu"
              className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 flex items-center justify-center transition overflow-hidden"
            >
              {/* Generic person avatar — no photo */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6 text-blue-700"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.85" />
                <path
                  d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5"
                  fill="currentColor"
                  opacity="0.85"
                />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50">
                <div className="text-sm font-bold text-gray-900 leading-tight break-words">
                  {profileName}
                </div>
                <div className="mt-1">
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {roleLabel}
                  </span>
                </div>

                {canSeeTeam && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      activeRouter.push("/crm/accounts");
                    }}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl px-4 py-2 transition"
                  >
                    My Team
                  </button>
                )}

                <button
                  onClick={() => logout(activeRouter)}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl px-4 py-2 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
