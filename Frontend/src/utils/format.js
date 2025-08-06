// Format currency
export const formatCurrency = (value, minimumFractionDigits = 0) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB", // Ethiopian Birr
    minimumFractionDigits,
  }).format(value);
};

// Format date for display (e.g., "15 Jan 2023")
export const formatDateForDisplay = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format date for input (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  return new Date(date).toISOString().split("T")[0];
};