import { useEffect, useState } from "react";
import { LayoutDashboard, CheckCircle, XCircle, QrCode } from "lucide-react";
import tableService from "../../services/tableService";

const StatCard = ({ title, value, icon: Icon, gradient, delay }) => (
  <div 
    className="glass-card p-8 rounded-3xl shadow-lg transition-all duration-500 hover:scale-105 cursor-pointer stagger-item"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">
          {title}
        </p>
        <h3 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          {value}
        </h3>
      </div>
      <div
        className="p-6 rounded-3xl shadow-xl transition-all duration-300 hover:scale-110"
        style={{
          background: gradient,
          boxShadow: "0 10px 40px rgba(255, 107, 157, 0.25)",
        }}
      >
        <Icon size={36} className="text-white drop-shadow-lg" />
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
      <div className="flex items-center gap-5 mb-12 stagger-item">
        <div
          className="p-5 rounded-3xl shadow-2xl transition-transform duration-300 hover:scale-110"
          style={{
            background: "linear-gradient(135deg, #FF6B9D, #EC4899)",
            boxShadow: "0 10px 40px rgba(255, 107, 157, 0.3)",
          }}
        >
          <LayoutDashboard className="text-white drop-shadow-lg" size={36} />
        </div>
        <div>
          <h2
            className="text-5xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #EC4899, #FB7185)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hệ thống quản trị
          </h2>
          <p className="text-pink-400 text-base mt-2 font-medium">
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
          gradient="linear-gradient(135deg, #FF6B9D, #FF8FAB)"
          delay={0.1}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          icon={CheckCircle}
          gradient="linear-gradient(135deg, #EC4899, #FF6B9D)"
          delay={0.2}
        />
        <StatCard
          title="Ngừng hoạt động"
          value={stats.inactive}
          icon={XCircle}
          gradient="linear-gradient(135deg, #F472B6, #FB7185)"
          delay={0.3}
        />
        <StatCard
          title="Mã QR khả dụng"
          value={stats.withQR}
          icon={QrCode}
          gradient="linear-gradient(135deg, #FFA8B6, #FFB6C1)"
          delay={0.4}
        />
      </div>
    </div>
  );
};

export default Dashboard;
