import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie,
  Cell, ResponsiveContainer,
} from "recharts";
import { FaPlus, FaDollarSign, FaMoneyBillWave, FaBalanceScale } from "react-icons/fa";
import AddEntryModal from "../components/AddEntryModal";

const COLORS = [
  "#4ade80", "#f87171", "#60a5fa", "#fbbf24",
  "#a78bfa", "#34d399", "#fb7185", "#3b82f6"
];

const formatCurrency = (value) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CircularStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center bg-white rounded-2xl shadow p-6 w-36">
    <div
      className="rounded-full p-4 mb-2"
      style={{ backgroundColor: `${color}33`, color }}
      aria-label={label}
    >
      <Icon size={32} />
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-xl font-semibold mt-1">{formatCurrency(value)}</p>
  </div>
);

const RecentTransactionItem = ({ entry }) => (
  <div className="flex justify-between items-center py-3 border-b last:border-none hover:bg-gray-50 rounded px-2 cursor-default transition-colors duration-150">
    <div className="flex flex-col">
      <span className="text-sm font-semibold capitalize">{entry.category}</span>
      <span className="text-xs text-gray-400">
        {new Date(entry.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
    <div className={`text-lg font-semibold ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
      {entry.type === "expense" ? "-" : "+"}{formatCurrency(Math.abs(entry.amount))}
    </div>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [trends, setTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, breakdownRes, entriesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/entries/summary"),
        axios.get("http://localhost:5000/api/entries/trends"),
        axios.get("http://localhost:5000/api/entries/category-breakdown"),
        axios.get("http://localhost:5000/api/entries?limit=5"),
      ]);

      setSummary(summaryRes.data);

      // Format trends for Recharts BarChart
      const formattedTrends = trendsRes.data.map((item) => {
        const monthDate = new Date(item._id + "-01");
        const monthLabel = monthDate.toLocaleString(undefined, { month: "short", year: "2-digit" });
        const obj = { period: monthLabel, income: 0, expense: 0 };
        item.data.forEach((d) => {
          obj[d.type] = d.total;
        });
        return obj;
      });
      setTrends(formattedTrends);

      setCategoryBreakdown(breakdownRes.data);
      setRecentEntries(entriesRes.data.entries || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center text-gray-500">
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      {/* Floating Add Entry Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        aria-label="Add Entry"
      >
        <FaPlus size={24} />
      </button>

      {/* Summary Stats */}
      <div className="flex justify-center gap-12 flex-wrap">
        <CircularStat icon={FaDollarSign} label="Total Income" value={summary.income} color="#22c55e" />
        <CircularStat icon={FaMoneyBillWave} label="Total Expense" value={summary.expense} color="#ef4444" />
        <CircularStat icon={FaBalanceScale} label="Balance" value={summary.balance} color="#2563eb" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trends Bar Chart */}
        <section className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-2">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Monthly Income vs Expense</h3>
          {trends.length === 0 ? (
            <p className="text-gray-500">No trend data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 5 }} barCategoryGap="30%">
                <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontWeight: "600" }} />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="income" fill="#22c55e" radius={[10, 10, 0, 0]} barSize={40} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={40} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Expense Breakdown Donut Chart */}
        <section className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Expense Breakdown by Category</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="text-gray-500">No expense data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  fill="#8884d8"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="bg-white p-6 rounded-2xl shadow-lg max-w-lg mx-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-800 text-center">Recent Transactions</h3>
        {recentEntries.length === 0 ? (
          <p className="text-gray-500 text-center">No recent transactions available.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentEntries.slice(0, 3).map((entry) => (
              <RecentTransactionItem key={entry._id} entry={entry} />
            ))}
          </div>
        )}
        {recentEntries.length > 3 && (
          <div className="text-center mt-4">
            <a href="/transactions" className="text-cyan-600 hover:text-cyan-800 font-semibold">
              View All Transactions &rarr;
            </a>
          </div>
        )}
      </section>

      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
