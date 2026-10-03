import { useEffect, useState, useCallback } from "react";

// The old version treated opening the contact menu as permanent dismissal.
const KEY = "teco_consultant_invites_v2";
function readInvites(): { count: number; dismissed: boolean } {
  try {
    const state = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    return { count: Number.isFinite(state?.count) ? state.count : 0, dismissed: state?.dismissed === true };
  }
  catch { return { count: 0, dismissed: false }; }
}

export function useConsultantInvite(mobile: boolean, enabled = true) {
  const [visible, setVisible] = useState(false);
  const hide = useCallback(() => setVisible(false), []);
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
    let activeSeconds = 0;
    let nextInvite = 5;
    let remainingVisible = 0;
    const timer = window.setInterval(() => {
      if (document.hidden || window.matchMedia("(max-width: 767px)").matches !== mobile) {
        setVisible(false);
        return;
      }
      activeSeconds += 1;
      if (remainingVisible > 0 && --remainingVisible === 0) setVisible(false);
      if (activeSeconds < nextInvite) return;
      const state = readInvites();
      if (state.dismissed || state.count >= 3) return;
      try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, count: state.count + 1 })); } catch {}
      setVisible(true);
      remainingVisible = 12;
      nextInvite = activeSeconds + 90;
    }, 1000);
    const onVisibility = () => { if (document.hidden) setVisible(false); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [mobile, stopped, enabled]);
  return { visible, dismiss, hide };
}
