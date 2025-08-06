import { useState, useCallback, useEffect, useMemo } from "react";
import api from "../api/axios";
import { useDataRefresh } from "../context/DataRefreshContext";

export const useTransactionData = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const { refreshData } = useDataRefresh();

  // Fetch entries with filters and pagination
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        type: filters.type,
        startdate: filters.startdate,
        enddate: filters.enddate,
        search: filters.search,
      };
      const res = await api.get("/entries", { params });
      setEntries(res.data.entries || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading entries", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Calculate totals
  const totalIncome = useMemo(() => {
    return entries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const totalExpense = useMemo(() => {
    return entries
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const netBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  // Sort entries
  const sortedEntries = useMemo(() => {
    if (entries.length === 0 || sortConfig.key === null) return entries;
    return [...entries].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [entries, sortConfig]);

  // Set up data fetching
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
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
  };
};