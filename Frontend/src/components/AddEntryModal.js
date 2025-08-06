import React, { useState, useEffect } from "react";
import { useDataRefresh } from "../context/DataRefreshContext";
import { FaTimes, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";

// Income and expense categories
const incomeCategories = [
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
  "Other",
];
const expenseCategories = [
  "Food",
  "Rent",
  "Utilities",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Travel",
  "Other",
];

const AddEntryModal = ({ isOpen, onClose, initialData }) => {
  const { refreshData } = useDataRefresh();
  const [entry, setEntry] = useState({
    type: "income",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing existing transaction
        setEntry({
          _id: initialData._id,
          type: initialData.type,
          amount: initialData.amount.toString(),
          category: initialData.category,
          note: initialData.note,
          date: initialData.date,
        });
      } else {
        // New transaction
        setEntry({
          type: "income",
          amount: "",
          category: "",
          note: "",
          date: new Date().toISOString().slice(0, 10),
        });
      }
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!entry.amount || !entry.category || !entry.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(entry.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    setLoading(true);

    try {
      // Create payload WITHOUT the _id field
      const { _id, ...payload } = entry;
      payload.amount = parseFloat(entry.amount);

      if (entry._id) {
        // Edit existing entry
        await api.put(`/entries/${entry._id}`, payload);
        toast.success("✅ Transaction updated successfully");
      } else {
        // Add new entry
        await api.post("/entries", payload);
        toast.success("✅ Transaction added successfully");
      }

      // Trigger data refresh
      refreshData();

      // Close modal
      onClose();
    } catch (err) {
      console.error("Transaction failed", err);

      // Show more detailed error message
      let errorMessage = `❌ Failed to ${
        entry._id ? "update" : "add"
      } transaction`;
      if (err.response && err.response.data) {
        errorMessage = `❌ ${
          err.response.data.error ||
          err.response.data.message ||
          "Error occurred"
        }`;
      }
      toast.error(errorMessage);

      if (err.response?.status === 401) {
        // Handle unauthorized access - redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-entry-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              id="add-entry-modal-title"
              className="text-xl font-bold text-slate-800 flex items-center gap-2"
            >
              {entry._id ? "Edit Transaction" : "Add New Transaction"}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-500 hover:text-slate-700 p-1 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEntry((prev) => ({ ...prev, type: "income" }))
                  }
                  className={`py-2 px-4 rounded-lg border transition-colors ${
                    entry.type === "income"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    Income
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEntry((prev) => ({ ...prev, type: "expense" }))
                  }
                  className={`py-2 px-4 rounded-lg border transition-colors ${
                    entry.type === "expense"
                      ? "bg-rose-50 border-rose-200 text-rose-700 font-medium"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                    Expense
                  </span>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  name="amount"
                  value={entry.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                  aria-required="true"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={entry.category}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none bg-white"
                  required
                  aria-required="true"
                  disabled={loading}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {(entry.type === "income"
                    ? incomeCategories
                    : expenseCategories
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Note (Optional)
              </label>
              <textarea
                name="note"
                value={entry.note}
                onChange={handleChange}
                placeholder="Additional details..."
                rows="3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={loading}
              ></textarea>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={entry.date}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                required
                aria-required="true"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : entry.type === "income"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                } text-white`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {entry._id ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <FaCheck /> {entry._id ? "Update" : "Add"} Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
