import { useState } from "react";
import { Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await signUp({ email, password, fullName });
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        // Email confirmation required by the Supabase project settings
        setDone(true);
      }
    } catch (err) {
      setError(err.message || "Could not create account");
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
            <div className="text-center py-4">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Check your email</h2>
              <p className="text-sm text-slate-500 mb-5">
                We've sent a confirmation link to <strong>{email}</strong>. Confirm it, then sign in.
              </p>
              <Link to="/login" className="text-maroon-500 font-medium text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Create your account</h2>
              <p className="text-sm text-slate-500 mb-5">Set up director-level access to the Command Center.</p>

              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="input mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@rajasthanpatrika.com"
                    className="input mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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
                  Create account
                </button>
              </form>

              <p className="text-sm text-slate-500 mt-5 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-maroon-500 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
