import React, { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(
        "https://career-school.co.in/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );

      const responseText = await response.text();

      if (response.ok) {
        let isSuccess = false;
        let token = null;

        try {
          const data = JSON.parse(responseText);
          // Point 1: If response is JSON, strictly require success status or a valid token
          if (
            data.status === "success" ||
            data.token ||
            data.accessToken ||
            data.jwt
          ) {
            isSuccess = true;
            token =
              data.token ||
              data.accessToken ||
              data.jwt ||
              data.data?.token ||
              null;
          }
        } catch {
          // Point 1: If plain text, verify it matches the backend's known success string
          if (responseText.trim().toLowerCase().includes("login successful")) {
            isSuccess = true;
          }
        }

        if (isSuccess) {
          sessionStorage.setItem("isHRAuthenticated", "true");

          // Point 2: Do not set dummy 'active_session'. Only store if a real token exists.
          if (token) {
            sessionStorage.setItem("hrToken", token);
          } else {
            sessionStorage.removeItem("hrToken");
          }

          router.push("/hr-portal");
          return;
        }
      }

      // Handle unverified response bodies or non-2xx status codes
      setLoginError(responseText || "Invalid credentials");
    } catch (err) {
      console.error("Login request error:", err);
      setLoginError("Cannot connect to server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          HR Portal Login
        </h2>

        {loginError && (
          <div className="mb-4 text-center text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl text-lg font-bold transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
