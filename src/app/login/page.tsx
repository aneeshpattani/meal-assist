"use client";

import { useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { MISSING_SUPABASE_CONFIG_MESSAGE } from "@/data/household";

export default function LoginPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasSupabaseConfig()) {
      setError(MISSING_SUPABASE_CONFIG_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p>We sent a magic link to <strong>{email}</strong>. Tap it to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Meal Assist</h1>
        <p>Sign in with your email to get started.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  );
}
