import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Divider, message } from "antd";
import { io } from "socket.io-client";
import {
  getOrders,
  updateOrderStatus,
} from "../../services/waiterOrderService";
import {
  formatClock,
  getOrderNumberLabel,
  getCreatedAt,
  playBeep,
  safeDate,
} from "../../components/kds/utils";
import { LANE, OVERDUE_MINUTES } from "../../components/kds/constants";
import { KDSHeader } from "../../components/kds/KDSHeader";
import KDSStatsRow from "../../components/kds/KDSStatsRow";
import KDSLaneColumn from "../../components/kds/KDSLaneColumn";
import OrderCard from "../../components/kds/OrderCard";

export default function KDS() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const prevPendingIdsRef = useRef(new Set());

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ limit: 100 });
      const payload = res?.data || res;
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Real-time updates via WebSocket (Socket.IO)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, "");

    const socket = io(`${socketBaseUrl}/kitchen`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    const refresh = () => {
      fetchAllOrders();
    };

    socket.on("connected", refresh);
    socket.on("new-order", refresh);
    socket.on("order-status-updated", refresh);
    socket.on("disconnect", (reason) => {
      // Keep this quiet (reconnect is automatic). Useful for debugging.
      console.warn("Kitchen socket disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("Kitchen socket connect_error:", err?.message || err);
    });

    return () => {
      socket.off("connected", refresh);
      socket.off("new-order", refresh);
      socket.off("order-status-updated", refresh);
      socket.disconnect();
    };
  }, [fetchAllOrders]);

  // Tick clock/timers
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Play sound when new pending orders appear
  useEffect(() => {
    const currentPendingIds = new Set(
      orders.filter((o) => o?.status === "pending" && o?.id).map((o) => o.id)
    );

    let hasNew = false;
    for (const id of currentPendingIds) {
      if (!prevPendingIdsRef.current.has(id)) {
        hasNew = true;
        break;
      }
    }

    prevPendingIdsRef.current = currentPendingIds;

    if (hasNew && soundOn) {
      playBeep();
    }
  }, [orders, soundOn]);

  const kdsOrders = useMemo(() => {
    const received = [];
    const preparing = [];
    const ready = [];

    for (const o of orders) {
      if (!o) continue;
      if (o.status === "pending" || o.status === "accepted") received.push(o);
      else if (o.status === "preparing") preparing.push(o);
      else if (o.status === "ready") ready.push(o);
    }

    const sortByCreatedAsc = (a, b) => {
      const at = safeDate(getCreatedAt(a))?.getTime() || 0;
      const bt = safeDate(getCreatedAt(b))?.getTime() || 0;
      return at - bt;
    };

    received.sort(sortByCreatedAsc);
    preparing.sort(sortByCreatedAsc);
    ready.sort(sortByCreatedAsc);

    return { received, preparing, ready };
  }, [orders]);

  const overdueCount = useMemo(() => {
    const thresholdMs = OVERDUE_MINUTES * 60 * 1000;
    return orders.filter((o) => {
      if (!getCreatedAt(o)) return false;
      if (!["pending", "accepted", "preparing"].includes(o.status))
        return false;
      const createdAt = safeDate(getCreatedAt(o));
      if (!createdAt) return false;
      return nowMs - createdAt.getTime() >= thresholdMs;
    }).length;
  }, [orders, nowMs]);

  const headerClock = useMemo(() => formatClock(new Date(nowMs)), [nowMs]);

  const runOrderAction = useCallback(
    async (orderId, actionName, fn) => {
      try {
        await fn();
        message.success(actionName);
        await fetchAllOrders();
      } catch (err) {
        message.error(err?.response?.data?.message || "Action failed");
      }
    },
    [fetchAllOrders]
  );

  const onStartCooking = useCallback(
    async (order) => {
      const orderId = order?.id;
      if (!orderId) return;

      if (order?.status !== "accepted") {
        message.info("This order must be accepted by Admin/Waiter first.");
        return;
      }

      await runOrderAction(orderId, "Cooking started", () =>
        updateOrderStatus(orderId, "preparing")
      );
    },
    [runOrderAction]
  );

  // Single-button workflow: if backend disallows accepted -> ready, do accepted -> preparing -> ready.
  const onMarkReady = useCallback(
    async (order) => {
      const orderId = order?.id;
      if (!orderId) return;

      if (order?.status !== "preparing") {
        message.info("Start cooking before marking ready.");
        return;
      }

      await runOrderAction(orderId, "Marked ready", async () => {
        await updateOrderStatus(orderId, "ready");
      });
    },
    [runOrderAction]
  );

  return (
    <div className="p-6">
      <KDSHeader
        headerClock={headerClock}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        loading={loading}
        onRefresh={fetchAllOrders}
        onBack={() => navigate("/admin/orders")}
      />

      <Divider />

      <KDSStatsRow
        receivedCount={kdsOrders.received.length}
        preparingCount={kdsOrders.preparing.length}
        readyCount={kdsOrders.ready.length}
        overdueCount={overdueCount}
      />

      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          overflowX: "auto",
        }}
      >
        <KDSLaneColumn
          lane={LANE.received}
          orders={kdsOrders.received}
          renderOrder={(o) => (
            <OrderCard
              key={o?.id ?? getOrderNumberLabel(o)}
              order={o}
              lane={LANE.received}
              nowMs={nowMs}
              onStartCooking={onStartCooking}
              onMarkReady={onMarkReady}
            />
          )}
        />
        <KDSLaneColumn
          lane={LANE.preparing}
          orders={kdsOrders.preparing}
          renderOrder={(o) => (
            <OrderCard
              key={o?.id ?? getOrderNumberLabel(o)}
              order={o}
              lane={LANE.preparing}
              nowMs={nowMs}
              onStartCooking={onStartCooking}
              onMarkReady={onMarkReady}
            />
          )}
        />
        <KDSLaneColumn
          lane={LANE.ready}
          orders={kdsOrders.ready}
          renderOrder={(o) => (
            <OrderCard
              key={o?.id ?? getOrderNumberLabel(o)}
              order={o}
              lane={LANE.ready}
              nowMs={nowMs}
              onStartCooking={onStartCooking}
              onMarkReady={onMarkReady}
            />
          )}
        />
      </div>

      <div
        style={{
          marginTop: 10,
          color: "rgba(0,0,0,0.45)",
          fontSize: 12,
        }}
      >
        Tip: Updates in real time via WebSocket.
      </div>
    </div>
  );
}
