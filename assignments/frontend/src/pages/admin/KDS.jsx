import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Divider, message } from "antd";
import {
  acceptOrder,
  getOrders,
  updateOrderStatus,
} from "../../services/waiterOrderService";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatClock,
  getOrderNumberLabel,
  getUserId,
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
  const { user } = useAuth();

  const waiterId = useMemo(() => getUserId(user), [user]);

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

  // Poll orders (simple approach; websocket wiring can come later)
  useEffect(() => {
    const id = window.setInterval(() => {
      fetchAllOrders();
    }, 5000);
    return () => window.clearInterval(id);
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
      if (o.status === "pending") received.push(o);
      else if (o.status === "accepted" || o.status === "preparing")
        preparing.push(o);
      else if (o.status === "ready") ready.push(o);
    }

    const sortByCreatedAsc = (a, b) => {
      const at = safeDate(a?.created_at)?.getTime() || 0;
      const bt = safeDate(b?.created_at)?.getTime() || 0;
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
      if (!o?.created_at) return false;
      if (!["pending", "accepted", "preparing"].includes(o.status))
        return false;
      const createdAt = safeDate(o.created_at);
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

  const onAcceptStart = useCallback(
    async (order) => {
      const orderId = order?.id;
      if (!orderId) return;
      if (!waiterId) {
        message.error("Missing waiter id");
        return;
      }

      await runOrderAction(orderId, "Order accepted", async () => {
        await acceptOrder(orderId, waiterId);
        await updateOrderStatus(orderId, "preparing");
      });
    },
    [runOrderAction, waiterId]
  );

  // Single-button workflow: if backend disallows accepted -> ready, do accepted -> preparing -> ready.
  const onMarkReady = useCallback(
    async (order) => {
      const orderId = order?.id;
      if (!orderId) return;

      await runOrderAction(orderId, "Marked ready", async () => {
        if (order?.status === "accepted") {
          await updateOrderStatus(orderId, "preparing");
        }
        await updateOrderStatus(orderId, "ready");
      });
    },
    [runOrderAction]
  );

  const onBump = useCallback(
    async (order) => {
      const orderId = order?.id;
      if (!orderId) return;
      await runOrderAction(orderId, "Bumped", () =>
        updateOrderStatus(orderId, "served")
      );
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
              onAcceptStart={onAcceptStart}
              onMarkReady={onMarkReady}
              onBump={onBump}
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
              onAcceptStart={onAcceptStart}
              onMarkReady={onMarkReady}
              onBump={onBump}
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
              onAcceptStart={onAcceptStart}
              onMarkReady={onMarkReady}
              onBump={onBump}
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
        Tip: Orders auto-refresh every 5 seconds.
      </div>
    </div>
  );
}
