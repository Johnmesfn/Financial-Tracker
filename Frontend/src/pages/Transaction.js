import React, { useState, useEffect } from "react";
import {
  FaTrashAlt,
  FaExchangeAlt,
  FaFileExport,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCalendar,
  FaSearch,
  FaRegCopy,
  FaArrowDown,
  FaArrowUp,
  FaPlus,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import AddEntryModal from "../components/AddEntryModal";
import SummaryCards from "../components/SummaryCards";
import {
  formatCurrency,
  formatDateForDisplay,
  formatDateForInput,
} from "../utils/format";
import { useTransactionData } from "../hooks/useTransactionData";
import api from "../api/axios"; // Added missing import

// Helper function to get period dates
const getPeriodDates = (period) => {
  const today = new Date();
  let startDate = new Date();
  switch (period) {
    case "today":
      startDate = new Date();
      break;
    case "thisWeek":
      startDate = new Date();
      startDate.setDate(today.getDate() - today.getDay());
      break;
    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "thisQuarter":
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      break;
    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case "last7Days":
      startDate = new Date();
      startDate.setDate(today.getDate() - 7);
      break;
    case "last30Days":
      startDate = new Date();
      startDate.setDate(today.getDate() - 30);
      break;
    default:
      startDate = new Date();
  }
  return {
    startdate: formatDateForInput(startDate),
    enddate: formatDateForInput(today),
  };
};

const Transaction = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    entries,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    loading,
    isSubmitting,
    setIsSubmitting,
    sortConfig,
    setSortConfig,
    fetchEntries,
    totalIncome,
    totalExpense,
    netBalance,
    sortedEntries,
    refreshData,
  } = useTransactionData();

  // Debounce search implementation - Fixed missing dependencies
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, setFilters, setPage]); // Added setPage to dependencies

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: "",
      startdate: "",
      enddate: "",
      search: "",
    });
    setSearchTerm("");
    setPage(1);
  };

  // Set time period filters
  const handleTimePeriodChange = (period) => {
    const { startdate, enddate } = getPeriodDates(period);
    setFilters((prev) => ({
      ...prev,
      startdate,
      enddate,
    }));
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // Sort handling
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    const formattedEntry = {
      ...transaction,
      date: new Date(transaction.date).toISOString().split("T")[0],
      amount: transaction.amount.toString(),
    };
    setEditingEntry(formattedEntry);
    setShowAddModal(true);
  };

  // Delete transaction
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/entries/${deleteId}`);
      toast.success("✅ Transaction deleted successfully");
      fetchEntries();
      refreshData();
    } catch (err) {
      console.error("Delete failed", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error("❌ Failed to delete transaction");
      }
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = entries.map((entry) => ({
      Type: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
      Amount: entry.amount,
      Category: entry.category,
      Note: entry.note,
      Date: formatDateForDisplay(entry.date),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    // Add summary row
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["", "", "", "", ""],
        ["Total Income", totalIncome.toFixed(2)],
        ["Total Expense", totalExpense.toFixed(2)],
        ["Net Balance", netBalance.toFixed(2)],
      ],
      { origin: -1 }
    );
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <FaExchangeAlt className="text-cyan-600" /> Transactions
          </h2>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
            {entries.length}{" "}
            {entries.length === 1 ? "transaction" : "transactions"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingEntry(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <FaPlus /> New Transaction
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg shadow transition"
          >
            <FaFileExport /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        income={totalIncome}
        expense={totalExpense}
        balance={netBalance}
      />

      {/* Filters */}
      <div className="bg-slate-100 p-4 rounded-lg flex flex-wrap gap-4 items-end shadow">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700 mb-1">
            Time Period
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => handleTimePeriodChange("today")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-purple-700 hover:bg-white"
            >
              Today
            </button>
            <button
              onClick={() => handleTimePeriodChange("thisWeek")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-purple-700 hover:bg-white"
            >
              This Week
            </button>
            <button
              onClick={() => handleTimePeriodChange("thisMonth")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-purple-700 hover:bg-white"
            >
              This Month
            </button>
            <button
              onClick={() => handleTimePeriodChange("thisQuarter")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-purple-700 hover:bg-white"
            >
              This Quarter
            </button>
            <button
              onClick={() => handleTimePeriodChange("thisYear")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-purple-700 hover:bg-white"
            >
              This Year
            </button>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <FaExchangeAlt />
            </span>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Start Date
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <FaCalendar />
            </span>
            <input
              type="date"
              name="startdate"
              value={filters.startdate}
              onChange={handleFilterChange}
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            End Date
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <FaCalendar />
            </span>
            <input
              type="date"
              name="enddate"
              value={filters.enddate}
              onChange={handleFilterChange}
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <FaSearch />
            </span>
            <input
              type="text"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by category, note..."
              className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg transition"
        >
          <FaRegCopy /> Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Recent Transactions
          </h2>
        </div>
        {loading && entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600 mb-4"></div>
            <p className="text-slate-600">Loading transactions...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-5xl mb-4 opacity-20">📊</div>
            <h3 className="text-xl font-semibold mb-2">
              No transactions found
            </h3>
            <p className="mb-6">
              Try adjusting your filters or adding a new transaction
            </p>
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <FaPlus /> Add New Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  <th
                    className="text-left px-6 py-3 cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    Type
                    {sortConfig.key === "type" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowDown className="inline ml-1" />
                      ) : (
                        <FaArrowUp className="inline ml-1" />
                      ))}
                  </th>
                  <th
                    className="text-left px-6 py-3 cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortConfig.key === "amount" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowDown className="inline ml-1" />
                      ) : (
                        <FaArrowUp className="inline ml-1" />
                      ))}
                  </th>
                  <th
                    className="text-left px-6 py-3 cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    Category
                    {sortConfig.key === "category" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowDown className="inline ml-1" />
                      ) : (
                        <FaArrowUp className="inline ml-1" />
                      ))}
                  </th>
                  <th
                    className="text-left px-6 py-3 cursor-pointer"
                    onClick={() => handleSort("note")}
                  >
                    Note
                    {sortConfig.key === "note" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowDown className="inline ml-1" />
                      ) : (
                        <FaArrowUp className="inline ml-1" />
                      ))}
                  </th>
                  <th
                    className="text-left px-6 py-3 cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    Date
                    {sortConfig.key === "date" &&
                      (sortConfig.direction === "asc" ? (
                        <FaArrowDown className="inline ml-1" />
                      ) : (
                        <FaArrowUp className="inline ml-1" />
                      ))}
                  </th>
                  <th className="text-left px-6 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => (
                  <tr
                    key={entry._id}
                    className="border-t hover:bg-slate-50 transition-colors"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(entry);
                    }}
                  >
                    <td className="px-6 py-3 capitalize">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          entry.type === "income"
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                        }`}
                        aria-hidden="true"
                      ></span>
                      <span className="sr-only">
                        {entry.type === "income" ? "Income" : "Expense"}
                      </span>
                      {entry.type}
                    </td>
                    <td
                      className={`px-6 py-3 font-medium ${
                        entry.type === "income"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                        {entry.category}
                      </span>
                    </td>
                    <td
                      className="px-6 py-3 max-w-xs truncate"
                      title={entry.note}
                    >
                      {entry.note || "-"}
                    </td>
                    <td className="px-6 py-3">
                      {formatDateForDisplay(entry.date)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2 text-lg">
                        <button
                          onClick={() => {
                            setDeleteId(entry._id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-rose-600 hover:text-rose-800 transition p-1 rounded hover:bg-rose-50"
                          title="Delete transaction"
                          aria-label={`Delete ${entry.category} transaction`}
                          disabled={isSubmitting}
                        >
                          <FaTrashAlt />
                        </button>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-cyan-600 hover:text-cyan-800 transition p-1 rounded hover:bg-cyan-50"
                          title="Edit transaction"
                          aria-label={`Edit ${entry.category} transaction`}
                          disabled={isSubmitting}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            aria-label="Previous page"
          >
            <FaArrowDown className="rotate-90" /> Previous
          </button>
          <span className="text-slate-700 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            aria-label="Next page"
          >
            Next <FaArrowDown className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${
          isDeleteModalOpen ? "block" : "hidden"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
          <h3
            id="delete-modal-title"
            className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"
          >
            <FaTrashAlt /> Confirm Deletion
          </h3>
          <p className="mb-6 text-slate-600">
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteId(null);
              }}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg transition flex items-center gap-2"
              aria-label="Cancel deletion"
              disabled={isSubmitting}
            >
              <FaTimes /> Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center gap-2"
              aria-label="Confirm deletion"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <FaCheck /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
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

export default Transaction;
