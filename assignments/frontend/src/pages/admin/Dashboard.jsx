import { useEffect, useState } from "react";
import { LayoutDashboard, CheckCircle, XCircle, QrCode } from "lucide-react";
import tableService from "../../services/tableService";

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }) => (
  <div className="glass-card p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          {title}
        </p>
        <h3 className="text-4xl font-black text-slate-900 group-hover:scale-110 transition-transform duration-300">
          {value}
        </h3>
      </div>
      <div
        className={`p-5 rounded-2xl shadow-lg ${colorClass} group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
        style={{
          background: gradient,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        }}
      >
        <Icon size={32} className="text-white drop-shadow-lg" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withQR: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await tableService.getAllTables();
      const tables = response.data || [];
      setStats({
        total: tables.length,
        active: tables.filter((t) => t.status === "active").length,
        inactive: tables.filter((t) => t.status === "inactive").length,
        withQR: tables.filter((t) => t.qrToken).length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header với Gradient Text */}
      <div className="flex items-center gap-4 mb-10">
        <div
          className="p-4 rounded-2xl shadow-xl"
          style={{
            background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
          }}
        >
          <LayoutDashboard className="text-white" size={32} />
        </div>
        <div>
          <h2
            className="text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hệ thống quản trị
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Theo dõi và quản lý toàn bộ hệ thống bàn
          </p>
        </div>
      </div>

      {/* Stats Cards với Gradient */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số bàn"
          value={stats.total}
          icon={LayoutDashboard}
          gradient="linear-gradient(135deg, #f43f5e, #fb923c)"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          icon={CheckCircle}
          gradient="linear-gradient(135deg, #10b981, #06b6d4)"
        />
        <StatCard
          title="Ngừng hoạt động"
          value={stats.inactive}
          icon={XCircle}
          gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
        />
        <StatCard
          title="Mã QR khả dụng"
          value={stats.withQR}
          icon={QrCode}
          gradient="linear-gradient(135deg, #8b5cf6, #3b82f6)"
        />
      </div>
    </div>
  );
};

export default Dashboard;
