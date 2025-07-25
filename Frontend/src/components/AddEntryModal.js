import React, { useState, Fragment, useEffect } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import { FaPlusCircle } from "react-icons/fa";
import toast from "react-hot-toast";

const incomeCategories = [
  "Salary",
  "Miscellaneous",
  "Savings",
  "Other",
];
const expenseCategories = [
  "Food",
  "Utilities",
  "Entertainment",
  "Transport",
  "Healthcare",
  "Education",
  "Miscellaneous",
  "Housing",
  "Insurance",
  "Debt Repayment",
  "Gifts/Donations",
  "Travel",
  "Pets",
  "Technology",
  "Subscriptions",
  "Personal Care",
  "Childcare",
  "Legal/Tax",
  "Repair/Maintenance",
  "Other",
];

function AddEntryModal({ isOpen, onClose, onEntryAdded }) {
  const [entry, setEntry] = useState({
    type: "income",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const categoryOptions = entry.type === "income" ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!isOpen) {
      setEntry({
        type: "income",
        amount: "",
        category: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(entry.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (!entry.category) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      ...entry,
      amount: parseFloat(entry.amount),
      note: entry.note.trim(),
    };

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/entries", payload);
      toast.success("✅ Entry added successfully!");
      if (onEntryAdded) onEntryAdded();
      onClose();
    } catch (err) {
      console.error("Failed to add entry:", err);
      toast.error(
        err.response?.data?.error || "❌ Failed to add entry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !loading && onClose()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center px-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <Dialog.Title className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <FaPlusCircle className="text-cyan-600" />
                Add Entry
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={entry.type}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={entry.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={entry.category}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    name="note"
                    value={entry.note}
                    onChange={handleChange}
                    maxLength={500}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={entry.date}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 10)}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded font-semibold text-white transition ${
                    loading
                      ? "bg-cyan-400 cursor-not-allowed"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  {loading ? "Adding..." : "Add Entry"}
                </button>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AddEntryModal;
