import { useEffect, useState } from "react";
import { store } from "./storage";

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      setContacts(await store.getContacts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  // Exact, case/whitespace-insensitive name match against the phone book.
  const emailFor = (name) => {
    if (!name) return "";
    const needle = name.trim().toLowerCase();
    if (!needle) return "";
    const hit = contacts.find((c) => c.name.trim().toLowerCase() === needle);
    return hit?.email || "";
  };

  return { contacts, loading, reload, emailFor };
}
