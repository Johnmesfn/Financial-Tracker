import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { FaTrashAlt, FaExchangeAlt, FaFileExport, FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

function Transaction() {
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    startdate: "",
    enddate: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { type, startdate, enddate, search } = filters;
      const res = await axios.get("http://localhost:5000/api/entries", {
        params: { page, type, startdate, enddate, search },
      });
      setEntries(res.data.entries || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading entries", err);
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Calculate totals using useMemo for performance
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const income = entries
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expense = entries
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    };
  }, [entries]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: "",
      startdate: "",
      enddate: "",
      search: "",
    });
    setPage(1);
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = entries.map(({ type, amount, category, note, date }) => ({
      Type: type.charAt(0).toUpperCase() + type.slice(1),
      Amount: amount,
      Category: category,
      Note: note,
      Date: new Date(date).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    // Add summary row
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["", "", "", "", ""],
      ["Total Income", totalIncome.toFixed(2), "", "", ""],
      ["Total Expense", totalExpense.toFixed(2), "", "", ""],
      ["Net Balance", netBalance.toFixed(2), "", "", ""]
    ], { origin: -1 });
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Pagination controls
  const renderPagination = () => (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Previous
      </button>
      <span className="text-slate-700 font-medium">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Next
      </button>
    </div>
  );

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
        <SummaryCard 
          title="Total Income" 
          value={`${totalIncome.toFixed(2)} Birr`} 
          bg="bg-emerald-100" 
          text="text-emerald-700" 
        />
        <SummaryCard 
          title="Total Expense" 
          value={`${totalExpense.toFixed(2)} Birr`} 
          bg="bg-rose-100" 
          text="text-rose-700" 
        />
        <SummaryCard 
          title="Net Balance" 
          value={`${netBalance.toFixed(2)} Birr`} 
          bg={netBalance >= 0 ? "bg-indigo-100" : "bg-amber-100"}
          text={netBalance >= 0 ? "text-indigo-700" : "text-amber-700"}
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-100 p-4 rounded-lg flex flex-wrap gap-4 items-end shadow">
        <SelectInput 
          name="type" 
          label="Type" 
          value={filters.type} 
          onChange={handleFilterChange}
        >
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </SelectInput>
        
        <TextInput 
          type="date" 
          name="startdate" 
          label="Start Date" 
          value={filters.startdate} 
          onChange={handleFilterChange} 
        />
        
        <TextInput 
          type="date" 
          name="enddate" 
          label="End Date" 
          value={filters.enddate} 
          onChange={handleFilterChange} 
        />
        
        <div className="flex-1 min-w-[200px] flex gap-2">
          <TextInput 
            type="text" 
            name="search" 
            label="Search" 
            value={filters.search} 
            onChange={handleFilterChange} 
            placeholder="Category or Note" 
            className="flex-1"
          />
          
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-300 hover:bg-slate-400 rounded text-sm h-[42px] mt-auto"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
          <p className="mt-2 text-slate-600">Loading transactions...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry._id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 capitalize">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          entry.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}></span>
                        {entry.type}
                      </td>
                      <td className={`px-4 py-3 font-medium ${
                        entry.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {entry.amount.toFixed(2)} Birr
                      </td>
                      <td className="px-4 py-3">{entry.category}</td>
                      <td className="px-4 py-3">{entry.note}</td>
                      <td className="px-4 py-3">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-lg">
                          <button
                            onClick={() => {
                              setDeleteId(entry._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-rose-600 hover:text-rose-800 transition"
                            title="Delete"
                            disabled={isSubmitting}
                          >
                            <FaTrashAlt />
                          </button>
                          <button
                            onClick={() => openEditModal(entry)}
                            className="text-cyan-600 hover:text-cyan-800 transition"
                            title="Edit"
                            disabled={isSubmitting}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-slate-500 py-6">
                      No transactions found. Try changing your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && renderPagination()}
        </>
      )}

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
            fetchEntries();
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

  // Open modal with entry data to edit
  function openEditModal(entry) {
    setEditEntry({
      ...entry,
      amount: entry.amount.toString(),
      date: entry.date.slice(0, 10),
    });
    setIsEditOpen(true);
  }

  // Close edit modal
  function closeEditModal() {
    setIsEditOpen(false);
    setEditEntry(null);
    setIsSubmitting(false);
  }

  // Handle form field change in edit modal
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditEntry(prev => ({ ...prev, [name]: value }));
  }

  // Submit edited entry
  async function handleEditSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...editEntry,
      amount: parseFloat(editEntry.amount),
    };

    try {
      await axios.put(`http://localhost:5000/api/entries/${editEntry._id}`, payload);
      toast.success("✅ Entry updated successfully");
      fetchEntries();
      closeEditModal();
    } catch (err) {
      console.error("Update failed", err);
      toast.error("❌ Failed to update entry");
      setIsSubmitting(false);
    }
  }
}

// Delete Confirmation Modal
function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Confirm Delete</h3>
        <p className="mb-6 text-slate-600">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
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
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Edit Transaction</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                name="type"
                value={entry.type}
                onChange={onChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              step="0.01"
              min="0"
            />
          </div>

          <TextInput
            label="Category"
            name="category"
            type="text"
            value={entry.category}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              name="note"
              value={entry.note}
              onChange={onChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
            />
          </div>
          
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
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable TextInput
function TextInput({ label, name, type = "text", value, onChange, placeholder = "", className = "", disabled = false, required = false, ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        {...props}
      />
    </div>
  );
}

// Reusable SelectInput
function SelectInput({ label, name, value, onChange, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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