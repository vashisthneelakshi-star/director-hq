import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Only fetches when `enabled` is true (i.e. the current user is an admin) —
// this hits /api/admin-users, which itself re-checks admin access server-side.
export function useDirectors(enabled) {
  const [directors, setDirectors] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch("/api/admin-users", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setDirectors(json.users || []);
      } catch {
        // silently ignore — owner badges just won't show
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

  const nameFor = (ownerId) => {
    const d = directors.find((x) => x.id === ownerId);
    return d?.fullName || d?.email || "";
  };

  return { directors, nameFor };
}
