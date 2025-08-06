import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added Link import
import { useAuth } from "../context/AuthContext";
import { FiLogIn } from "react-icons/fi";

const isValidEmail = (email) => {
  if (!email.includes("@") || !email.includes(".")) {
    return false;
  }
  const disposableDomains = [
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "guerrillamail.com",
    "trashmail.com",
  ];
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !disposableDomains.includes(domain);
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid, non-disposable email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.message || "Failed to login.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-cyan-100 rounded-lg">
            <FiLogIn className="text-cyan-600" size={24} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
        <p className="text-slate-600">Sign in to your account</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor="email"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg shadow transition disabled:opacity-75"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Signing in...
            </>
          ) : (
            <>
              <FiLogIn /> Sign In
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;