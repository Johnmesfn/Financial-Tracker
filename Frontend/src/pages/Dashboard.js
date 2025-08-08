import React, { useEffect, useState } from "react";
import { FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AddEntryModal from "../components/AddEntryModal";
import SummaryCards from "../components/SummaryCards";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatCurrency } from "../utils/format";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    summary,
    trends,
    expenseCategories,
    incomeCategories,
    transactions,
    loading,
    error,
    refreshData,
  } = useDashboardData();

  // Edit transaction function
  const handleEdit = (transaction) => {
    const formattedEntry = {
      ...transaction,
      date: new Date(transaction.date).toISOString().split("T")[0],
      amount: transaction.amount.toString(),
    };
    setEditingEntry(formattedEntry);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center py-16 text-gray-500 text-lg">
          Loading financial dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center py-16 text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  // Charts section
  const ChartsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Monthly Trends */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Monthly Income vs Expenses
          </h2>
        </div>
        <div className="p-6">
          <div className="h-64 md:h-72">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <XAxis dataKey="period" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `$${value > 1000 ? value / 1000 + "k" : value}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "10px",
                      border: "1px solid rgba(200, 200, 255, 0.3)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      padding: "12px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Recent Transactions */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Recent Transactions
          </h2>
          <button
            onClick={() => navigate("/transaction")}
            className="text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-1"
          >
            View All <FiArrowRight />
          </button>
        </div>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  <th className="text-left px-6 py-3">CATEGORY</th>
                  <th className="text-left px-6 py-3">DATE</th>
                  <th className="text-left px-6 py-3">AMOUNT</th>
                  <th className="text-left px-6 py-3 w-20">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs capitalize">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td
                      className={`px-6 py-3 font-medium ${
                        transaction.type === "income"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-cyan-600 hover:text-cyan-800 transition p-1 rounded hover:bg-cyan-50"
                        title="Edit transaction"
                        aria-label={`Edit ${transaction.category} transaction`}
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            No transactions found
          </div>
        )}
      </div>
    </div>
  );

  // Category breakdown section
  const CategoryBreakdownSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Spending by Category */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Spending by Category
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div className="h-64 md:h-72 flex-1">
              {expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="total"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 50 : 70}
                      innerRadius={isMobile ? 20 : 35}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      labelPosition="outside"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#6366f1",
                              "#ec4899",
                              "#8b5cf6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "10px",
                        border: "1px solid rgba(200, 200, 255, 0.3)",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {summary.expense > 0
                    ? "No expense categories found"
                    : "No expenses recorded yet"}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-0">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {expenseCategories.map((category, index) => (
                  <div key={category._id} className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full self-start flex-shrink-0 mt-1"
                      style={{
                        backgroundColor: [
                          "#6366f1",
                          "#ec4899",
                          "#8b5cf6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                        ][index % 6],
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-medium text-slate-700 truncate"
                          title={category._id}
                        >
                          {category._id}
                        </span>
                        <div className="flex justify-between items-center mt-1">
                          <span
                            className="text-xs text-slate-500 truncate"
                            title={formatCurrency(category.total)}
                          >
                            {formatCurrency(category.total)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">
                            {((category.total / summary.expense) * 100).toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Income by Category */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Income by Category
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div className="h-64 md:h-72 flex-1">
              {incomeCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      dataKey="total"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 50 : 70}
                      innerRadius={isMobile ? 20 : 35}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      labelPosition="outside"
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#6366f1",
                              "#ec4899",
                              "#8b5cf6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "10px",
                        border: "1px solid rgba(200, 200, 255, 0.3)",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {summary.income > 0
                    ? "No income categories found"
                    : "No income recorded yet"}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-0">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {incomeCategories.map((category, index) => (
                  <div key={category._id} className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full self-start flex-shrink-0 mt-1"
                      style={{
                        backgroundColor: [
                          "#6366f1",
                          "#ec4899",
                          "#8b5cf6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                        ][index % 6],
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-medium text-slate-700 truncate"
                          title={category._id}
                        >
                          {category._id}
                        </span>
                        <div className="flex justify-between items-center mt-1">
                          <span
                            className="text-xs text-slate-500 truncate"
                            title={formatCurrency(category.total)}
                          >
                            {formatCurrency(category.total)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">
                            {((category.total / summary.income) * 100).toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <FiTrendingUp className="text-cyan-600" /> Financial Dashboard
        </h2>
        <button
          onClick={() => {
            setEditingEntry(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Transaction
        </button>
      </div>

      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
      />

      <ChartsSection />
      <CategoryBreakdownSection />

      <AddEntryModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(null);
        }}
        onSuccess={refreshData}
        initialData={editingEntry}
      />
    </div>
  );
};

export default Dashboard;
