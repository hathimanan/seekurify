import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Card, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface PasswordEntry {
  _id: string;
  website: string;
  username: string;
  password: string;
  currentPassword?: string; // For editing
  category?: string;
  notes?: string;
  createdAt: string;
}

// Website icons mapping
const getWebsiteIcon = (website: string) => {
  const domain = website.toLowerCase();
  if (domain.includes('google')) return 'G';
  if (domain.includes('facebook')) return 'f';
  if (domain.includes('yahoo')) return 'Y!';
  if (domain.includes('twitter') || domain.includes('x.com')) return 'X';
  if (domain.includes('amazon')) return 'amazon';
  return website.charAt(0).toUpperCase();
};

const getWebsiteColor = (website: string) => {
  const domain = website.toLowerCase();
  if (domain.includes('google')) return 'bg-red-500';
  if (domain.includes('facebook')) return 'bg-blue-600';
  if (domain.includes('yahoo')) return 'bg-purple-600';
  if (domain.includes('twitter') || domain.includes('x.com')) return 'bg-black';
  if (domain.includes('amazon')) return 'bg-orange-500';
  return 'bg-gray-600';
};




export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [email, setEmail] = useState(user?.email);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewingPassword, setViewingPassword] = useState<PasswordEntry | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showReverifyPinModal, setShowReverifyPinModal] = useState(false);
  const [reverifyPinInput, setReverifyPinInput] = useState('');
  const [isReverified, setIsReverified] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null); // modal toggle

  const navigate = useNavigate();


  const handleReverifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`  // optional for this route if not required
        },
        body: JSON.stringify({
          email: user?.email,           // ✅ Ensure email is included
          pin: reverifyPinInput         // ✅ PIN input
        })
      });


      const data = await response.json();
      if (data.token) {
        setIsReverified(true);
        setShowReverifyPinModal(false);
        // Now allow user to update their PIN or perform the action
      } else {
        alert('Incorrect PIN. Try again.');
      }
    } catch (error) {
      alert('Error verifying PIN.');
    }
  };


  // Form state
  const [formData, setFormData] = useState({
    website: '',
    username: '',
    password: '',
    category: 'General',
    notes: ''
  });

  useEffect(() => {

    if (showEditModal) {
      setFormData(prev => ({ ...prev, password: '' }));
    }
    loadPasswords();
  }, [showEditModal]);

  const loadPasswords = async () => {
    setShowReverifyPinModal(true);
    try {
      setIsLoading(true);
      const data = await apiService.getPasswords();
      setPasswords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passwords');
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeaders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("❌ No token found in localStorage");
      return {
        'Content-Type': 'application/json'
      };
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addPassword(formData);


      setFormData({ website: '', username: '', password: '', category: 'General', notes: '' });
      setShowAddForm(false);
      loadPasswords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add password');
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      website: password.website,
      username: password.username,
      password: password.password,
      category: password.category || 'General',
      notes: password.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassword) return;

    try {
      await apiService.updatePassword(editingPassword._id, {
        ...formData,
        currentPassword: currentPassword
      });
      setSuccessMessage('Password updated successfully!');
setShowEditModal(false);
setEditingPassword(null);
setFormData({  website: '', username: '', password: '', category: '', notes: '' });
loadPasswords();
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error?.includes("Current password does not match")) {
        setError("Incorrect current password. Please try again.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout(); // <- call your logout function
        navigate("/login"); // or window.location.href = '/login'
      }


      else {
        setError(err instanceof Error ? err.message : 'Failed to update password');
      }
    }

  };

  const handleDeletePassword = async (id: string) => {
    // 1️⃣ Confirm deletion
    if (!confirmId) return;

    setIsDeleting(confirmId);
    try {
      await apiService.deletePassword(confirmId);
      setPasswords((current) => current.filter((pw) => pw._id !== confirmId));
    } catch (err) {
      console.error('Error deleting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete password');
    } finally {
      setIsDeleting(null);
      setConfirmId(null);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (



    <div className="p-0">


      <div className="min-h-screen bg-blue-400 p-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-red-500 text-white px-1 py-1 rounded mb-4"
        >
          ⬅️ Back
        </button>
        {/* Header */}
        <div className="flex items-center mb-6">
          {/* <div className="bg-red-600 p-3 rounded-lg mr-4">
          <ArrowLeft className="w-6 h-6 text-white" />
        </div> */}
          <div>
            <h1 className="text-xl font-bold text-black">
              Welcome to Password Manager dashboard, {user?.email}!
            </h1>
          </div>
        </div>



        {/* Saved Passwords Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black">Saved Passwords</h2>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Add New
            </Button>
          </div>



          {isLoading ? (


            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="mt-2 text-black">Loading passwords...</p>
            </div>
          ) : !passwords || passwords.length === 0 ? (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">No passwords saved yet. Add your first password to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {passwords.map((password) => (
                <div
                  key={password._id}
                  className="bg-blue-500 p-4 rounded-lg text-white relative group"
                >
                  {/* Website Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 ${getWebsiteColor(password.website)} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                      {getWebsiteIcon(password.website)}
                    </div>

                    {/* Edit/Delete Icons */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setViewingPassword(password);
                          setShowPassword(true);
                        }}
                        className="text-white hover:text-green-300"
                        title="View"
                      >
                        👁️
                      </button>


                      <button
                        onClick={() => handleEditPassword(password)}
                        className="text-white hover:text-yellow-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <Button
                        variant="destructive"
                        disabled={isDeleting === password._id}
                        onClick={() => setConfirmId(password._id)}
                        className="p-2"
                      >
                        {isDeleting === password._id ? 'Deleting...' : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
                    <DialogContent className="rounded-2xl p-6 max-w-md">
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                      </DialogHeader>
                      <div className="text-gray-700 mb-4">
                        Are you sure you want to delete this password?
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setConfirmId(null)}
                          disabled={isDeleting !== null}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePassword(confirmId!)}
                          disabled={isDeleting !== null}
                        >
                          {isDeleting !== null ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Website Info */}
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm opacity-80">Website URL</span>
                      <p className="font-semibold truncate">{password.website}</p>
                    </div>
                    <div>
                      <span className="text-sm opacity-80">Username</span>
                      <p className="font-semibold truncate">{password.username}</p>
                    </div>
                    <div>
                      <span className="text-sm opacity-80">Password</span>
                      <p className="font-semibold">••••••••</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {showReverifyPinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm">
              <h3 className="text-xl font-bold text-black mb-4">Re-enter PIN to Confirm</h3>
              <form onSubmit={handleReverifyPinSubmit} className="space-y-4">
                <input
                  type="email"
                  value={user?.email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md focus:outline-none cursor-not-allowed"
                  disabled
                />

                <input
                  type="password"
                  value={reverifyPinInput}
                  onChange={(e) => setReverifyPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Confirm
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPassword && viewingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold text-black mb-4">View Password Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black">Website</label>
                  <input
                    type="text"
                    value={viewingPassword.website}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Username</label>
                  <input
                    type="text"
                    value={viewingPassword.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Password</label>
                  <input
                    type="text"
                    value={viewingPassword.password}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setShowPassword(false);
                      setViewingPassword(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}








        {showEditModal &&  (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-yellow-400 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold text-black mb-4">Edit Password</h3>

              {successMessage && (
  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
    {successMessage}
  </div>
)}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mt-4">Current Password</label>
                  <input
                    type="password"
                    className="mt-1 p-2 border w-full rounded"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    onClick={generatePassword}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md mt-2"
                  >
                    Generate
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPassword(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Update
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}





        {/* Add Password Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold text-black mb-4">Add New Password</h3>
              <form onSubmit={handleAddPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Website/Service
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Username/Email
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Password
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      onClick={generatePassword}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />

                  </div>
                </div>



                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};