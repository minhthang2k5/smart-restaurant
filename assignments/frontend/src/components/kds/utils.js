import { OVERDUE_MINUTES, WARNING_MINUTES } from "./constants";

export const safeDate = (v) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
};

export const formatClock = (d) =>
  d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const formatElapsed = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const getUserId = (user) => user?.id || user?.data?.id || user?.user?.id;

export const getOrderNumberLabel = (order) => {
  if (order?.order_number) return order.order_number;
  if (order?.id) return `#${String(order.id).slice(0, 6)}`;
  return "—";
};

export const getTableLabel = (order) => {
  const num = order?.table?.table_number;
  if (num) return `Table ${num}`;
  return order?.table_id ? `Table ${order.table_id}` : "Table —";
};

export const isNewPendingOrder = (order, nowMs) => {
  if (order?.status !== "pending") return false;
  const createdAt = safeDate(order?.created_at);
  if (!createdAt) return false;
  return nowMs - createdAt.getTime() <= 60 * 1000;
};

export const orderTimerTone = (elapsedMs) => {
  const minutes = elapsedMs / (60 * 1000);
  if (minutes >= OVERDUE_MINUTES) return "danger";
  if (minutes >= WARNING_MINUTES) return "warning";
  return "normal";
};

export const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);

    osc.onended = () => {
      ctx.close?.();
    };
  } catch {
    // ignore
  }
};
