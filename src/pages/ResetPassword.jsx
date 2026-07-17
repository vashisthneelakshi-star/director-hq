import { useEffect, useState } from "react";
import { Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL and fires this event
    // once a temporary "password recovery" session is ready to use.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the session was already established before this listener attached, check directly too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-maroon-500 flex items-center justify-center mb-3">
            <Briefcase size={22} className="text-gold-200" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Director HQ</h1>
          <p className="text-ink-400 text-sm">Command Center</p>
        </div>

        <div className="bg-paper-100 rounded-2xl shadow-card p-7">
          {done ? (
            <div className="text-center py-2">
              <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Password updated</h2>
              <p className="text-sm text-slate-500">Taking you to the dashboard...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-2">
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Verifying link...</h2>
              <p className="text-sm text-slate-500 mb-4">
                If this doesn't resolve in a few seconds, the reset link may have expired.
              </p>
              <Link to="/forgot-password" className="text-sm font-medium text-maroon-500 hover:underline">
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Set a new password</h2>
              <p className="text-sm text-slate-500 mb-5">Choose a new password for your account.</p>

              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">New password</span>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Confirm password</span>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="input mt-1"
                  />
                </label>

                {error && <p className="text-sm text-maroon-500 bg-maroon-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-maroon-500 hover:bg-maroon-600 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Update password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
