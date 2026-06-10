"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");

  const login = () => {
    if (password === "Aniz@2026") {
      localStorage.setItem("isAdmin", "true");
      window.location.href = "/";
    } else {
      alert("Wrong Password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-80 rounded-lg border p-6">
        <h1 className="mb-4 text-xl font-bold">
          Admin Login
        </h1>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
        />

        <button
          onClick={login}
          className="mt-4 w-full rounded bg-blue-600 p-2 text-white"
        >
          Login
        </button>
      </div>
    </div>
  );
}