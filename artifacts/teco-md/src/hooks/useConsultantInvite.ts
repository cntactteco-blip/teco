import { useEffect, useState, useCallback } from "react";

const KEY = "teco_consultant_invites";
function readInvites(): { count: number; dismissed: boolean } {
  try {
    const state = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    return { count: Number.isFinite(state?.count) ? state.count : 0, dismissed: state?.dismissed === true };
  }
  catch { return { count: 0, dismissed: false }; }
}

export function useConsultantInvite(mobile: boolean, enabled = true) {
  const [visible, setVisible] = useState(false);
  const [stopped, setStopped] = useState(() => readInvites().dismissed);
  const dismiss = useCallback(() => {
    setVisible(false);
    setStopped(true);
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...readInvites(), dismissed: true })); } catch {}
  }, []);
  useEffect(() => {
    window.addEventListener("teco:open-consultant", dismiss);
    return () => window.removeEventListener("teco:open-consultant", dismiss);
  }, [dismiss]);
  useEffect(() => {
    if (stopped || !enabled) { setVisible(false); return; }
    const timers = [12000, 90000].flatMap((delay) => [
      window.setTimeout(() => {
        const state = readInvites();
        if (document.hidden || window.matchMedia("(max-width: 767px)").matches !== mobile || state.dismissed || state.count >= 2) return;
        try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, count: state.count + 1 })); } catch {}
        setVisible(true);
      }, delay),
      window.setTimeout(() => setVisible(false), delay + 8000),
    ]);
    const hide = () => { if (document.hidden) setVisible(false); };
    document.addEventListener("visibilitychange", hide);
    return () => { timers.forEach(window.clearTimeout); document.removeEventListener("visibilitychange", hide); };
  }, [mobile, stopped, enabled]);
  return { visible, dismiss };
}
