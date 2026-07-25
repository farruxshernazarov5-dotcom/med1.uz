import { useCallback, useEffect, useState } from "react";

const KEY = "med1_doctor_favorites";
const COMPARE_KEY = "med1_doctor_compare";

function read(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

export function useDoctorFavorites() {
  const [ids, setIds] = useState<string[]>(() => read(KEY));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setIds(read(KEY)); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has };
}

export function useDoctorCompare() {
  const [ids, setIds] = useState<string[]>(() => read(COMPARE_KEY));

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      let next: string[];
      if (prev.includes(id)) next = prev.filter(x => x !== id);
      else if (prev.length >= 4) next = [...prev.slice(1), id];
      else next = [...prev, id];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.setItem(COMPARE_KEY, "[]");
    setIds([]);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has, clear };
}
