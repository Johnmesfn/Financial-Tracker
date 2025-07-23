import React, { useState } from "react";
import axios from "axios";
import { FaPlusCircle } from "react-icons/fa";

function AddEntry() {
  const [entry, setEntry] = useState({
    type: "income",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...entry, amount: parseFloat(entry.amount) };

    try {
      await axios.post("http://localhost:5000/api/entries", payload);
      setMessage("✅ Entry added successfully!");
      setEntry({
        type: "income",
        amount: "",
        category: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Failed to add entry:", err);
      setMessage("❌ Failed to add entry. See console for details.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FaPlusCircle className="text-cyan-600" /> Add Income / Expense
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 space-y-4 border border-slate-200"
      >
        <div>
          <label className="block text-slate-700 font-medium mb-1">Type</label>
          <select
            name="type"
            value={entry.type}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={entry.amount}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={entry.category}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Note (optional)</label>
          <input
            type="text"
            name="note"
            value={entry.note}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={entry.date}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded transition duration-300"
        >
          Add Entry
        </button>
      </form>

      {message && (
        <p className="mt-4 text-slate-800 font-medium">{message}</p>
      )}
    </div>
  );
}

export default AddEntry;
