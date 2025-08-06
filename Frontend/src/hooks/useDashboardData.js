import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import { useDataRefresh } from "../context/DataRefreshContext";

export const useDashboardData = () => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [trends, setTrends] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { refreshToken, refreshData } = useDataRefresh();
  const refreshTokenRef = useRef(refreshToken);

  // Update the ref when refreshToken changes
  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        trendsRes,
        expenseBreakdownRes,
        incomeBreakdownRes,
        entriesRes,
      ] = await Promise.all([
        api.get("/entries/summary"),
        api.get("/entries/trends"),
        api.get("/entries/category-breakdown?type=expense"),
        api.get("/entries/category-breakdown?type=income"),
        api.get("/entries?limit=5"),
      ]);
      setSummary(summaryRes.data);
      
      // Format trends data for the chart
      const formattedTrends = trendsRes.data.map((item) => {
        const monthDate = new Date(item._id + "-01");
        const monthLabel = monthDate.toLocaleString(undefined, {
          month: "short",
          year: "2-digit",
        });
        const trendData = {
          period: monthLabel,
          income: 0,
          expense: 0,
        };
        item.data.forEach((dataItem) => {
          if (dataItem.type === "income") trendData.income = dataItem.total;
          if (dataItem.type === "expense") trendData.expense = dataItem.total;
        });
        return trendData;
      });
      setTrends(formattedTrends);
      setExpenseCategories(expenseBreakdownRes.data);
      setIncomeCategories(incomeBreakdownRes.data);
      setTransactions(entriesRes.data.entries || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies now

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshToken]);

  return {
    summary,
    trends,
    expenseCategories,
    incomeCategories,
    transactions,
    loading,
    error,
    refreshData,
  };
};