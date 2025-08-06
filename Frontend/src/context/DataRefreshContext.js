import React, { createContext, useContext, useState } from "react";

const DataRefreshContext = createContext();

export const DataRefreshProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState(0);
  
  const refreshData = () => {
    setRefreshToken(prev => prev + 1);
  };
  
  return (
    <DataRefreshContext.Provider value={{ refreshToken, refreshData }}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = () => useContext(DataRefreshContext);