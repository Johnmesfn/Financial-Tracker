import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaChartLine, FaPlus, FaUserShield } from "react-icons/fa";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-cyan-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Finance Tracker</h1>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6 text-slate-100 font-medium">
            <li className="hover:text-white flex items-center space-x-1">
             
              <Link to="/">Dashboard</Link>
            </li>
            <li className="hover:text-white flex items-center space-x-1">
              
              <Link to="/add">Add Entry</Link>
            </li>
            <li className="hover:text-white flex items-center space-x-1">
              
              <Link to="/transaction">Transaction</Link>
            </li>
          </ul>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={toggleMenu}>
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <ul className="md:hidden bg-cyan-700 text-white px-4 pb-4 space-y-2 font-medium">
          <li className="flex items-center space-x-2">
            <FaChartLine />
            <Link to="/">Dashboard</Link>
          </li>
          <li className="flex items-center space-x-2">
            <FaPlus />
            <Link to="/add">Add Entry</Link>
          </li>
          <li className="flex items-center space-x-2">
            <FaUserShield />
            <Link to="/admin">Admin Panel</Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default NavBar;
