import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";

/**
 * Configuration
 * Keep parity with your original: enforce non-disposable emails on login.
 * If you prefer to allow disposable emails for login, set this to false.
 */
const ENFORCE_NON_DISPOSABLE_ON_LOGIN = true;

/**
 * Disposable domains list (sample)
 * Use a Set for O(1) lookup, and support subdomain matches.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "trashmail.com",
]);

const isValidEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

/**
 * Checks if email domain is disposable (supports subdomains).
 * E.g., sub.mailinator.com -> matches mailinator.com
 */
const isDisposable = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS.has(candidate)) return true;
  }
  return false;
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", global: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);

  const { email, password } = formData;

  // Focus alert when a global (server) error appears
  useEffect(() => {
    if (errors.global && alertRef.current) {
      alertRef.current.focus();
    }
  }, [errors.global]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear only the field-specific error on change; keep global until next submit
    if (name === "email" || name === "password") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors = { email: "", password: "", global: "" };

    // Client-side validation
    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmailFormat(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (ENFORCE_NON_DISPOSABLE_ON_LOGIN && isDisposable(trimmedEmail)) {
      nextErrors.email = "Please use a non-disposable email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      // Focus the first invalid field
      if (nextErrors.email) {
        emailRef.current?.focus();
      } else if (nextErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    // Clear only the global error on submit; field errors are clear by now
    setErrors((prev) => ({ ...prev, global: "" }));

    try {
      const result = await login(trimmedEmail, password);

      // Normalize success and message across possible login implementations
      let success = false;
      let message = "";

      if (result === true) {
        success = true;
      } else if (result?.success === true) {
        success = true;
      } else if (result?.success === false) {
        message = result?.message || "";
      } else if (result === undefined) {
        // Some implementations may not return anything on success
        success = true;
      }

      if (success) {
        navigate("/", { replace: true });
        return;
      }

      setErrors({ email: "", password: "", global: message || "Invalid email or password." });
      // alert will auto-focus via useEffect
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred. Please try again.";
      setErrors({ email: "", password: "", global: message });
      // alert will auto-focus via useEffect
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

      {errors.global && (
        <div
          className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          ref={alertRef}
        >
          {errors.global}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate aria-busy={loading}>
        <div className="mb-4">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor="email"
          >
            Email
          </label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              errors.email ? "border-rose-400" : "border-slate-300"
            }`}
            placeholder="Enter your email"
            autoComplete="username"
            autoFocus
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-rose-600">
              {errors.email}
            </p>
          )}
        </div>

        <div className="mb-2">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.password ? "border-rose-400" : "border-slate-300"
              }`}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-rose-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="mb-6 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg shadow transition disabled:opacity-75"
        >
          {loading ? (
            <>
              <span
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                aria-hidden="true"
              ></span>
              <span className="sr-only">Signing in...</span>
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
          Don&apos;t have an account?{" "}
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