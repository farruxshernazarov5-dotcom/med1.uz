import { useCallback, useEffect, useState } from "react";

const KEY = "med1_doctor_favorites";
const CHANGE_EVENT = "med1-doctor-selection";
const COMPARE_KEY = "med1_doctor_compare";

function read(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []; } catch { return []; }
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
      queueMicrotask(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has };
}

export function useDoctorCompare() {
  const [ids, setIds] = useState<string[]>(() => read(COMPARE_KEY));

  useEffect(() => {
    const sync = () => setIds(read(COMPARE_KEY));
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      let next: string[];
      if (prev.includes(id)) next = prev.filter(x => x !== id);
      else if (prev.length >= 4) next = [...prev.slice(1), id];
      else next = [...prev, id];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      queueMicrotask(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.setItem(COMPARE_KEY, "[]");
    setIds([]);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has, clear };
}
