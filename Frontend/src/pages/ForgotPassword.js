// src/pages/ForgotPassword.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiKey, FiSend } from "react-icons/fi";

/**
 * Configuration
 * Typically you should NOT block disposable emails here to avoid friction,
 * but you can turn this on if you want similar behavior as registration.
 */
const ENFORCE_NON_DISPOSABLE_ON_RESET = false;

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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ email: "", global: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Try to support whichever function your AuthContext exposes
  const { requestPasswordReset, forgotPassword, sendPasswordResetEmail } = useAuth();

  const emailRef = useRef(null);
  const alertRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (errors.global && alertRef.current) {
      alertRef.current.focus();
    }
  }, [errors.global]);

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.focus();
    }
  }, [success]);

  const onChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    const nextErrors = { email: "", global: "" };

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmailFormat(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (ENFORCE_NON_DISPOSABLE_ON_RESET && isDisposable(trimmedEmail)) {
      nextErrors.email = "Please use a non-disposable email address.";
    }

    if (nextErrors.email) {
      setErrors(nextErrors);
      emailRef.current?.focus();
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, global: "" }));

    try {
      const fn = requestPasswordReset || forgotPassword || sendPasswordResetEmail;
      if (!fn) {
        console.error("No password reset function provided by useAuth()");
        setErrors({
          email: "",
          global: "Password reset is not available right now. Please contact support.",
        });
        return;
      }

      // Intentionally do not surface whether the email exists, to prevent user enumeration.
      await fn(trimmedEmail);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "We couldn’t process your request. Please try again.";
      setErrors({ email: "", global: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-cyan-100 rounded-lg">
            <FiKey className="text-cyan-600" size={24} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
        <p className="text-slate-600">We’ll email you a link to reset your password</p>
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

      {success ? (
        <div
          className="p-4 bg-emerald-50 text-emerald-800 rounded-lg"
          role="status"
          aria-live="polite"
          tabIndex={-1}
          ref={successRef}
        >
          <p className="font-medium">Check your email</p>
          <p className="text-sm mt-1">
            If an account exists for that address, we’ve sent instructions to reset your password.
            Please check your inbox and spam folder.
          </p>

          <div className="mt-6 flex items-center justify-between">
            <Link
              to="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Back to Sign In
            </Link>
            <Link
              to="/register"
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Create an account
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate aria-busy={loading}>
          <div className="mb-6">
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
                <span className="sr-only">Sending reset link...</span>
                Sending reset link...
              </>
            ) : (
              <>
                <FiSend /> Send reset link
              </>
            )}
          </button>

          <div className="mt-6 text-center text-sm">
            <Link
              to="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;