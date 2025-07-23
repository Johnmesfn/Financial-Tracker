import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTrashAlt,
  FaExchangeAlt,
  FaFileExport,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Transaction() {
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    startdate: "",
    enddate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEntries = useCallback(async () => {
    try {
      const { type, startdate, enddate } = filters;
      const res = await axios.get("http://localhost:5000/api/entries", {
        params: { page, type, startdate, enddate },
      });
      setEntries(res.data.entries);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error loading entries", err);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/entries/${id}`);
      setMessage("✅ Entry deleted");
      fetchEntries();
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("❌ Delete failed");
    }
  };

  const handleExport = () => {
    const exportData = entries.map(
      ({ type, amount, category, note, date }) => ({
        Type: type,
        Amount: amount,
        Category: category,
        Note: note,
        Date: new Date(date).toLocaleDateString(),
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "transactions.xlsx");
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FaExchangeAlt className="text-cyan-600" /> Transactions
        </h2>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded shadow"
        >
          <FaFileExport /> Export Excel
        </button>
      </div>

      <div className="bg-slate-100 p-4 rounded mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-slate-800 text-sm font-medium">
            Type
          </label>
          <select
            name="type"
            onChange={handleFilterChange}
            value={filters.type}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-800 text-sm font-medium">
            Start Date
          </label>
          <input
            type="date"
            name="startdate"
            value={filters.startdate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2"
          />
        </div>

        <div>
          <label className="block text-slate-800 text-sm font-medium">
            End Date
          </label>
          <input
            type="date"
            name="enddate"
            value={filters.enddate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2"
          />
        </div>
      </div>

      {message && <p className="mb-4 text-slate-800 font-medium">{message}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md border border-slate-200 rounded-lg">
          <thead className="bg-cyan-600 text-white">
            <tr>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Note</th>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries?.length > 0 ? (
              entries?.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 text-slate-800 capitalize">
                    {entry.type}
                  </td>
                  <td className="px-4 py-2 text-slate-800">
                    {entry.amount} Birr
                  </td>
                  <td className="px-4 py-2 text-slate-800">{entry.category}</td>
                  <td className="px-4 py-2 text-slate-800">{entry.note}</td>
                  <td className="px-4 py-2 text-slate-800">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <FaTrashAlt /> Delete
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

      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-slate-700">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Transaction;
