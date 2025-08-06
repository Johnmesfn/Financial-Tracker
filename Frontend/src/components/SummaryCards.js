import React from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { FiDollarSign } from "react-icons/fi"; // Changed from 'react-icons/fa'
import { formatCurrency } from "../utils/format";

const SummaryCard = ({ title, value, icon, bg, text }) => (
  <div className={`rounded-xl p-6 ${bg} shadow flex items-center gap-3`}>
    <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className={`mt-1 text-2xl font-bold ${text}`}>{value}</p>
    </div>
  </div>
);

const SummaryCards = ({ income, expense, balance }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <SummaryCard
      title="TOTAL INCOME"
      value={formatCurrency(income)}
      icon={<FaArrowDown className="text-emerald-500" />}
      bg="bg-emerald-50"
      text="text-emerald-700"
    />
    <SummaryCard
      title="TOTAL EXPENSES"
      value={formatCurrency(expense)}
      icon={<FaArrowUp className="text-rose-500" />}
      bg="bg-rose-50"
      text="text-rose-700"
    />
    <SummaryCard
      title="CURRENT BALANCE"
      value={formatCurrency(balance)}
      icon={<FiDollarSign className="text-indigo-500" />}
      bg="bg-indigo-50"
      text="text-indigo-700"
    />
  </div>
);

export default SummaryCards;