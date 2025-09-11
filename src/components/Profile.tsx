import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { API_BASE_URL } from "../services/api";
import { FaCamera } from "react-icons/fa";

interface UserProfile {
  name: string;
  email: string;
  username: string;
  profileImage: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editableUser, setEditableUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /** Fetch Profile on Mount */
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized or failed to fetch profile");
        const data: UserProfile = await res.json();

        setUser(data);
        setEditableUser(data);
      } catch (err) {
        console.error("Fetch profile error:", err);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  /** Save Profile */
  const handleSave = async () => {
    if (!editableUser) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editableUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUser(data);
      setEditableUser(data);
      setIsEditing(false);
      setError("");
      setSuccessMessage("Profile updated successfully!");

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  /** Logout */
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to call logout endpoint", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  /** Upload Image */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgData = reader.result as string;
        setProfileImage(imgData);
        setEditableUser((prev) =>
          prev ? { ...prev, profileImage: imgData } : prev
        );
      };
      reader.readAsDataURL(file);

      // Send to backend
      const formData = new FormData();
      formData.append("profileImage", file);

      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/profile/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    }
  };

  /** Handle PIN Verification */
  const handleVerifyPin = async () => {
    setError("");

    if (!pinInput.trim()) {
      setError("PIN field cannot be empty.");
      return;
    }
    if (!/^\d+$/.test(pinInput)) {
      setError("PIN must contain only numeric values.");
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user?.email,
          pin: pinInput,
        }),
      });

      const data = await res.json();
      if (data.token) {
        setShowPinModal(false);
        navigate("/change-password");
      } else {
        setError("Incorrect PIN. Please try again.");
      }
    } catch {
      setError("Error verifying PIN.");
    } finally {
      setIsVerifying(false);
    }
  };

  /** Loading State */
  if (isLoading) {
    return (
      <p className="text-center mt-20 text-gray-600 text-lg">Loading...</p>
    );
  }

  /** Get Initials */
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-gray-100 relative">
<Header
  token={localStorage.getItem("token") || ""}
  handleLogout={handleLogout}
  profileImage={user?.profileImage || ""} // ✅ pass uploaded image
/>

        <main className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen rounded-lg">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg shadow-md hover:scale-105 transition transform duration-200"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          </div>

          {/* Profile Card */}
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
              <div className="flex flex-col items-center">
                {/* Avatar */}
               <div className="relative group w-24 h-24 mb-4">
  {editableUser?.profileImage ? (
    <img
      src={editableUser.profileImage}
      alt="Profile"
      className="w-full h-full rounded-full object-cover shadow-md"
    />
  ) : (
    <div className="w-full h-full bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-3xl font-bold shadow-md">
      {initials}
    </div>
  )}

  {/* Hover overlay */}
  <div
    onClick={() => fileInputRef.current?.click()}
    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-300"
  >
    <FaCamera className="text-white text-xl" />
  </div>

  {/* Hidden file input */}
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    className="hidden"
    onChange={handleImageUpload}
  />
</div>

              {/* Profile Fields */}
              <div className="space-y-5 mt-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableUser?.name || ""}
                      onChange={(e) =>
                        setEditableUser((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium mt-1">
                      {editableUser?.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600">
                    Email Address
                  </label>
                  <p className="text-gray-900 font-medium mt-1">
                    {user?.email}
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600">
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableUser?.username || ""}
                      onChange={(e) =>
                        setEditableUser((prev) =>
                          prev ? { ...prev, username: e.target.value } : prev
                        )
                      }
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium mt-1">
                      {user?.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600">
                    Password
                  </label>
                  <p className="text-gray-900 font-medium mt-1">************</p>

                  <button
                    onClick={() => setShowPinModal(true)}
                    className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-200"
                  >
                    Change Password &rarr;
                  </button>
                </div>

                {/* Error & Success */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm">
                    {successMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditableUser(user);
                          setIsEditing(false);
                          setError("");
                        }}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Verify PIN</h2>

            <input
              type="password"
              placeholder="Enter your PIN"
              value={pinInput}
              onChange={(e) =>
                setPinInput(e.target.value.replace(/\D/g, ""))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleVerifyPin}
                disabled={isVerifying}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {isVerifying ? "Verifying..." : "Verify & Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
