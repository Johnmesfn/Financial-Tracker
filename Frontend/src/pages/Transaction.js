import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaTrashAlt, FaExchangeAlt, FaFileExport, FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

function Transaction() {
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    startdate: "",
    enddate: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Editing state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const { type, startdate, enddate } = filters;
      const res = await axios.get("http://localhost:5000/api/entries", {
        params: { page, type, startdate, enddate },
      });
      setEntries(res.data.entries || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading entries", err);
      toast.error("Failed to load entries");
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Open modal with entry data to edit
  const openEditModal = (entry) => {
    setEditEntry({
      ...entry,
      amount: entry.amount.toString(),
      date: entry.date.slice(0, 10),
    });
    setIsEditOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditEntry(null);
    setIsSubmitting(false);
  };

  // Handle form field change in edit modal
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditEntry((prev) => ({ ...prev, [name]: value }));
  };

  // Submit edited entry
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...editEntry,
      amount: parseFloat(editEntry.amount),
    };

    try {
      await axios.put(`http://localhost:5000/api/entries/${editEntry._id}`, payload);
      toast.success("✅ Entry updated successfully");

      setEntries((prev) =>
        prev.map((entry) =>
          entry._id === editEntry._id ? { ...payload, _id: editEntry._id } : entry
        )
      );

      closeEditModal();
    } catch (err) {
      console.error("Update failed", err);
      toast.error("❌ Failed to update entry");
      setIsSubmitting(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const filteredEntries = entries.filter((entry) => {
    const keyword = filters.search.toLowerCase();
    return (
      entry.category.toLowerCase().includes(keyword) ||
      entry.note.toLowerCase().includes(keyword)
    );
  });

  const totalIncome = filteredEntries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = filteredEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredEntries.map(({ type, amount, category, note, date }) => ({
      Type: type,
      Amount: amount,
      Category: category,
      Note: note,
      Date: new Date(date).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "transactions.xlsx");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <FaExchangeAlt className="text-cyan-600" /> Transactions
        </h2>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          <FaFileExport /> Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SummaryCard title="Total Income" value={`${totalIncome.toFixed(2)} Birr`} bg="bg-emerald-100" text="text-emerald-700" />
        <SummaryCard title="Total Expense" value={`${totalExpense.toFixed(2)} Birr`} bg="bg-rose-100" text="text-rose-700" />
        <SummaryCard title="Net Balance" value={`${netBalance.toFixed(2)} Birr`} bg="bg-indigo-100" text="text-indigo-700" />
      </div>

      {/* Filters */}
      <div className="bg-slate-100 p-4 rounded-lg flex flex-wrap gap-4 items-end shadow">
        <SelectInput name="type" label="Type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </SelectInput>
        <TextInput type="date" name="startdate" label="Start Date" value={filters.startdate} onChange={handleFilterChange} />
        <TextInput type="date" name="enddate" label="End Date" value={filters.enddate} onChange={handleFilterChange} />
        <TextInput type="text" name="search" label="Search" value={filters.search} onChange={handleFilterChange} placeholder="Category or Note" className="flex-1 min-w-[150px]" />
      </div>

      {/* Message */}
      {message && <p className="text-sm text-slate-600">{message}</p>}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-200 text-slate-800">
            <tr>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Note</th>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <tr key={entry._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 capitalize">{entry.type}</td>
                  <td className="px-4 py-2">{entry.amount} Birr</td>
                  <td className="px-4 py-2">{entry.category}</td>
                  <td className="px-4 py-2">{entry.note}</td>
                  <td className="px-4 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 flex gap-3 text-lg">
                    <button
                      onClick={() => {
                        setDeleteId(entry._id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-rose-600 hover:text-rose-800"
                      title="Delete"
                      disabled={isSubmitting}
                    >
                      <FaTrashAlt />
                    </button>
                    <button
                      onClick={() => openEditModal(entry)}
                      className="text-cyan-600 hover:text-cyan-800"
                      title="Edit"
                      disabled={isSubmitting}
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-slate-500 py-4">
                  No entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-slate-700 text-sm">Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Edit Modal */}
      {isEditOpen && editEntry && (
        <EditModal
          entry={editEntry}
          onChange={handleEditChange}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await axios.delete(`http://localhost:5000/api/entries/${deleteId}`);
            toast.success("✅ Entry deleted successfully");
            setEntries((prev) => prev.filter((entry) => entry._id !== deleteId));
          } catch (err) {
            toast.error("❌ Failed to delete entry");
          } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Confirm Delete</h3>
        <p className="mb-6 text-slate-600">
          Are you sure you want to delete this entry? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditModal({ entry, onChange, onClose, onSubmit, isSubmitting }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Edit Entry</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select
              name="type"
              value={entry.type}
              onChange={onChange}
              disabled={isSubmitting}
              className="mt-1 block w-full border border-slate-300 rounded px-3 py-2"
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <TextInput
            label="Amount"
            name="amount"
            type="number"
            value={entry.amount}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
          <TextInput
            label="Category"
            name="category"
            type="text"
            value={entry.category}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
          <TextInput
            label="Note"
            name="note"
            type="text"
            value={entry.note}
            onChange={onChange}
            disabled={isSubmitting}
          />
          <TextInput
            label="Date"
            name="date"
            type="date"
            value={entry.date}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
              disabled={isSubmitting}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable TextInput
function TextInput({ label, name, type = "text", value, onChange, placeholder = "", className = "", disabled = false, required = false }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="mt-1 block w-full border border-slate-300 rounded px-3 py-2"
      />
    </div>
  );
}

// Reusable SelectInput
function SelectInput({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full border border-slate-300 rounded px-3 py-2"
      >
        {children}
      </select>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, bg, text }) {
  return (
    <div className={`rounded-xl p-6 ${bg} ${text} shadow`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default Transaction;
