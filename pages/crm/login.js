import React, { useState } from "react";
import { useRouter } from "next/router";
import { crmApi } from "../../lib/crmApi";
import { storeSession } from "../../lib/crmAuth";

/**
 * Dedicated CRM login. Separate from the HR portal login (/HRLogin). On success the token +
 * user are stored under the crm keys and the user is routed to their role's dashboard.
 */
export default function CrmLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await crmApi.login(username.trim(), password);
      storeSession(data.token, {
        id: data.id,
        username: data.username,
        role: data.role,
      });
      // Every role lands on the leads dashboard; its content is scoped by role.
      router.push("/crm/leads");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold tracking-widest px-3 py-1 rounded-full mb-3">
            CRM
          </span>
          <h2 className="text-3xl font-bold text-blue-800">CRM Dashboard Login</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sign in with your CRM credentials.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-center text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-2 text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl text-lg font-bold transition disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
