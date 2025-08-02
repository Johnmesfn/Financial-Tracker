import React, { useState, Fragment, useEffect } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";

const incomeCategories = ["Salary", "Miscellaneous", "Savings", "Other"];
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

  const categoryOptions =
    entry.type === "income" ? incomeCategories : expenseCategories;

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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center px-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-6 border border-white/30"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
              }}
            >
              {/* Gradient top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl"></div>

              <Dialog.Title className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FiPlus className="text-blue-600" />
                Add New Transaction
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        name="type"
                        value={entry.type}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-white/60 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 appearance-none"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={entry.amount}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        disabled={loading}
                        placeholder="0.00"
                        className="w-full bg-white/60 border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={entry.category}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full bg-white/60 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    name="note"
                    value={entry.note}
                    onChange={handleChange}
                    maxLength={500}
                    disabled={loading}
                    placeholder="Add a description..."
                    className="w-full bg-white/60 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={entry.date}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 10)}
                    disabled={loading}
                    className="w-full bg-white/60 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    }`}
                  >
                    {loading ? "Adding..." : "Add Transaction"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AddEntryModal;
