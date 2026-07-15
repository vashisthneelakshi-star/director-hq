import { useState } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in");
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
          <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-5">Use your director account to continue.</p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                autoFocus
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
              Sign in
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-5 text-center">
            New director?{" "}
            <Link to="/signup" className="text-maroon-500 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
