import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import NavBar from "./components/NavBar";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transaction" element={<Transaction />} />
        </Routes>

        {/* Global toast notifications */}
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </Router>
  );
}

export default App;
