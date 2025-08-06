import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaSave, FaCamera } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Settings = () => {
  const navigate = useNavigate();
  const { user, refreshData } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatarFlag, setRemoveAvatarFlag] = useState(false); // New state for avatar removal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setAvatarPreview(user.avatar || null);
      setRemoveAvatarFlag(false); // Reset removal flag on mount
    }
  }, [user]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
    if (success) setSuccess("");
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Avatar size must be less than 2MB");
        return;
      }
      if (!file.type.match("image.*")) {
        setError("Please select an image file");
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatarFlag(false); // Reset removal flag when new avatar is selected
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setError("Passwords do not match");
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError("Current password is required to set a new password");
      return;
    }

    setLoading(true);

    try {
      const updateData = new FormData();
      updateData.append("name", formData.name.trim());
      updateData.append("email", formData.email.trim());

      // Handle avatar removal
      if (removeAvatarFlag) {
        updateData.append("removeAvatar", "true");
      }

      // Handle new avatar upload
      if (avatar) {
        updateData.append("avatar", avatar);
      }

      if (formData.newPassword) {
        updateData.append("currentPassword", formData.currentPassword);
        updateData.append("newPassword", formData.newPassword);
      }

      const response = await api.put("/auth/update", updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Profile updated successfully");

      if (response.data.user) {
        refreshData();
      }

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    setRemoveAvatarFlag(true); // Set removal flag
  };

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaCog /> Account Settings
          </h1>
          <p className="text-cyan-100 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Avatar Section */}
              <div className="md:col-span-1">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Profile Picture
                </h2>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                        {getUserInitials(formData.name, formData.email)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("avatar-upload").click()
                      }
                      className="absolute bottom-0 right-0 bg-cyan-600 text-white p-2 rounded-full shadow-md hover:bg-cyan-700 transition-colors"
                    >
                      <FaCamera />
                    </button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={onAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-sm text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}

                  <p className="text-xs text-slate-500 mt-4 text-center">
                    JPG, GIF or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">
                  Personal Information
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={onChange}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Enter your email address"
                      disabled={loading}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-md font-medium text-slate-800 mb-4">
                      Change Password
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={onChange}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Enter current password"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={onChange}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Enter new password"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={onChange}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Confirm new password"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-75"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
