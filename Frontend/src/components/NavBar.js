import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChartLine,
  FaExchangeAlt,
  FaUser,
  FaUserPlus,
  FaSignOutAlt,
  FaCaretDown,
  FaCog,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  // Determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle logout with navigation
  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = (name, email) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <FaChartLine className="text-cyan-600" size={20} />
              </div>
              <Link
                to="/"
                className="text-xl font-bold text-slate-800 flex items-center gap-2"
              >
                Finance Tracker
              </Link>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoading ? (
              // Show loading placeholder while checking auth
              <div className="flex items-center space-x-6">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <ul className="flex space-x-6">
                  <li>
                    <Link
                      to="/"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive("/")
                          ? "text-cyan-600 font-medium bg-cyan-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <FaChartLine size={16} />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transaction"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive("/transaction")
                          ? "text-cyan-600 font-medium bg-cyan-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <FaExchangeAlt size={16} />
                      <span>Transactions</span>
                    </Link>
                  </li>
                </ul>
                
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-3 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="relative">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                          {getUserInitials(user?.name, user?.email)}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {user?.name || user?.email}
                      </p>
                    </div>
                    <FaCaretDown className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-10 border border-slate-200 overflow-hidden"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                              {getUserInitials(user?.name, user?.email)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaCog className="text-slate-400" />
                          <span>Settings</span>
                        </Link>
                        
                        <div className="border-t border-slate-100 my-1"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          role="menuitem"
                        >
                          <FaSignOutAlt className="text-rose-500" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ul className="flex space-x-6">
                <li>
                  <Link
                    to="/login"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive("/login")
                        ? "text-cyan-600 font-medium bg-cyan-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <FaUser />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive("/register")
                        ? "text-cyan-600 font-medium bg-cyan-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <FaUserPlus />
                    <span>Register</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>
          
          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-slate-700 hover:text-slate-900 p-2 rounded-lg"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <ul className="px-4 py-3 space-y-2">
            {isLoading ? (
              // Show loading placeholder for mobile menu
              <>
                <li className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="h-5 w-5 bg-slate-200 rounded-full animate-pulse"></div>
                  <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
                </li>
              </>
            ) : isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive("/")
                        ? "bg-cyan-50 text-cyan-600 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaChartLine size={18} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/transaction"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive("/transaction")
                        ? "bg-cyan-50 text-cyan-600 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaExchangeAlt size={18} />
                    <span>Transactions</span>
                  </Link>
                </li>
                <li className="relative">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                          {getUserInitials(user?.name, user?.email)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user?.name || user?.email}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleUserMenu}
                      className="text-slate-400"
                    >
                      <FaCaretDown className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  {/* Mobile User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="mt-2 ml-3 w-52 bg-white rounded-xl shadow-lg py-2 z-10 border border-slate-200">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                              {getUserInitials(user?.name, user?.email)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[160px]">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaCog className="text-slate-400" />
                          <span>Settings</span>
                        </Link>
                        
                        <div className="border-t border-slate-100 my-1"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <FaSignOutAlt className="text-rose-500" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive("/login")
                        ? "bg-cyan-50 text-cyan-600 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaUser />
                    <span>Login</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive("/register")
                        ? "bg-cyan-50 text-cyan-600 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaUserPlus />
                    <span>Register</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavBar;