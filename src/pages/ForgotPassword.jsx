import { useState } from "react";
import { Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function ForgotPassword() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send reset email");
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
          {sent ? (
            <div className="text-center py-2">
              <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Check your email</h2>
              <p className="text-sm text-slate-500">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>, a password
                reset link has been sent. It can take a minute to arrive — check spam too.
              </p>
              <Link to="/login" className="inline-block mt-5 text-sm font-medium text-maroon-500 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink_text mb-1">Reset password</h2>
              <p className="text-sm text-slate-500 mb-5">
                Enter your account email and we'll send you a link to set a new password.
              </p>

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

                {error && <p className="text-sm text-maroon-500 bg-maroon-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-maroon-500 hover:bg-maroon-600 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Send reset link
                </button>
              </form>

              <p className="text-sm text-slate-500 mt-5 text-center">
                <Link to="/login" className="text-maroon-500 font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
