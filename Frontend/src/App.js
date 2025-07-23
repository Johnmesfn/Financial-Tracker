import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddEntry from "./pages/AddEntry";
import Transaction from "./pages/Transaction"; // Assuming AdminPanel.js is the admin page
import NavBar from "./components/NavBar";
import "./index.css"; // Ensure styles are imported

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddEntry />} />
        <Route path="/transaction" element={<Transaction />} />
      </Routes>
    </Router>
  );
}

export default App;
