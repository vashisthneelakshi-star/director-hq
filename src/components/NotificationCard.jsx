import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import {
  isPushSupported,
  getPushPermissionState,
  getExistingSubscription,
  enableDailyReminders,
  disableDailyReminders,
} from "../lib/push";

export default function NotificationCard() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const ok = isPushSupported();
      setSupported(ok);
      if (!ok) return;
      const sub = await getExistingSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  async function handleEnable() {
    setLoading(true);
    setError("");
    try {
      await enableDailyReminders(user.id);
      setSubscribed(true);
    } catch (err) {
      setError(err.message || "Could not enable notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      await disableDailyReminders();
      setSubscribed(false);
    } catch (err) {
      setError(err.message || "Could not disable notifications.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="bg-paper-100 rounded-xl border border-paper-200 p-5 flex items-center gap-4 justify-between flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-maroon-100 flex items-center justify-center shrink-0">
          {subscribed ? <BellRing size={18} className="text-maroon-700" /> : <Bell size={18} className="text-maroon-700" />}
        </div>
        <div>
          <p className="font-medium text-ink-900">Daily reminders</p>
          <p className="text-sm text-ink-500">
            {subscribed
              ? "You'll get a notification each morning if you have meetings or tasks due today."
              : "Get notified on this device when you have meetings or tasks due today."}
          </p>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={loading}
        className="px-4 py-2 rounded-lg border border-paper-300 text-sm font-medium hover:border-maroon-300 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
      >
        {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
        {loading ? "Please wait..." : subscribed ? "Turn off" : "Enable reminders"}
      </button>
    </div>
  );
}
