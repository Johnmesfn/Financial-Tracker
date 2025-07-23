import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaChartPie, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

const COLORS = ["#06b6d4", "#475569"]; // cyan-500, slate-600

function Dashboard() {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/entries/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("Dashboard load error", err));
  }, []);

  const pieData = [
    { name: "Income", value: summary.income },
    { name: "Expense", value: summary.expense },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FaChartPie className="text-cyan-600" />
        Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <FaArrowUp className="text-cyan-600 text-xl" />
          <div>
            <p className="text-slate-600 text-sm">Income</p>
            <p className="text-xl font-bold text-slate-800">{summary.income} Birr</p>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <FaArrowDown className="text-red-600 text-xl" />
          <div>
            <p className="text-slate-600 text-sm">Expense</p>
            <p className="text-xl font-bold text-slate-800">{summary.expense} Birr</p>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:cursor-pointer hover:shadow-lg transition-shadow duration-200">
          {/* Use MdOutlineAccountBalanceWallet for balance */}
          <MdOutlineAccountBalanceWallet className="text-green-600 text-xl" />
          <div>
            <p className="text-slate-600 text-sm">Balance</p>
            <p className="text-xl font-bold text-slate-800">{summary.balance} Birr</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-4">
        <h3 className="text-slate-700 font-semibold mb-4">Income vs Expense</h3>
        <div className="w-full h-80">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
                className="hover:cursor-pointer"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
