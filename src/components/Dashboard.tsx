import React, { useState, useEffect  } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { set } from 'mongoose';
import { reload } from 'firebase/auth';

interface PasswordEntry {
  _id: string;
  website: string;
  username: string;
  password: string;
  currentPassword?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  // for payment
}


interface PaymentEntry {
  name?: string | '';
  email?: string | '';
  contact?: string | '';
  amount: number | 0;
}




// Website icons mapping
const getWebsiteIcon = (website: string) => {
  const domain = website.toLowerCase();
  if (domain.includes('google')) return 'G';
  if (domain.includes('facebook')) return 'f';
  if (domain.includes('yahoo')) return 'Y!';
  if (domain.includes('twitter') || domain.includes('x.com')) return 'X';
  if (domain.includes('amazon')) return 'a';
  return website.charAt(0).toUpperCase();
};

const getWebsiteColor = (website: string) => {
  const domain = website.toLowerCase();
  if (domain.includes('google')) return 'bg-gradient-to-br from-red-500 to-pink-500';
  if (domain.includes('facebook')) return 'bg-gradient-to-br from-blue-600 to-blue-400';
  if (domain.includes('yahoo')) return 'bg-gradient-to-br from-purple-600 to-violet-500';
  if (domain.includes('twitter') || domain.includes('x.com')) return 'bg-gradient-to-br from-gray-900 to-black';
  if (domain.includes('amazon')) return 'bg-gradient-to-br from-yellow-500 to-orange-500';
  return 'bg-gradient-to-br from-gray-600 to-gray-400';
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
  const [pinError, setPinError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [prevRoute, setPrevRoute] = useState("/homePageAfterLogin"); // default route
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [hasPaid, setHasPaid] = useState<boolean>(false); // 🚨 Payment status
  const [showPayModal, setShowPayModal] = useState(false);
const [reverifyPinError, setReverifyPinError] = useState('');
const [showTrialModal, setShowTrialModal] = useState(false);
const [trialMessage, setTrialMessage] = useState("");
const [trialActive, setTrialActive] = useState(false);
const [showOnlyPayModal, setShowOnlyPayModal] = useState(false);
const [isTrialExpired, setTrialExpired] = useState(false);
const [trialAcknowledged, setTrialAcknowledged] = useState(false);
const location = useLocation();


  const navigate = useNavigate();

const handleReverifyPinSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        pin: reverifyPinInput,
      }),
    });

    const data = await response.json();
    console.log("PIN verify response:", data);

    if (data.token) {
      setIsReverified(true);
      setShowReverifyPinModal(false);
      setPinError(false);
      setReverifyPinInput("");

      // ✅ Call handleViewPassword automatically if a password was requested
      if (confirmId) {
        handleViewPassword(confirmId); // reuse your existing function
        setConfirmId(null); // reset after use
      }

      // optional: refresh full password list if needed
      await loadPasswords(Date.now());
    } else {
      setPinError(true);
    }
  } catch (error) {
    console.error("Error verifying PIN:", error);
    setPinError(true);
  }
};




  // Form state
  const [passwordformData, setPasswordFormData] = useState({
    website: '',
    username: '',
    password: '',
    category: 'General',
    notes: '',
  });


  const [paymentFormData, setPaymentFormData] = useState<PaymentEntry>({
    name: '',
    email: '',
    contact: '',
    amount: 100, // default amount
  });


// FRONTEND: Dashboard.tsx (Core Fixes)

useEffect(() => {
  let isMounted = true;

  const initialize = async () => {
    if (!isMounted) return;

    await checkPaymentStatus();
  };

  initialize();

  return () => { isMounted = false; };
}, [location.pathname]);


const validateReverifyPin = (e: React.FormEvent) => {
  e.preventDefault();
  setReverifyPinError('');

  if (!reverifyPinInput.trim()) {
    setReverifyPinError('PIN field cannot be empty.');
    return;
  }

  if (!/^\d+$/.test(reverifyPinInput)) {
    setReverifyPinError('PIN must contain only numeric values.');
    return;
  }

  handleReverifyPinSubmit(e);
};

  // ----------------------------
  // Load passwords
  // ----------------------------
const loadPasswords = async (cacheBuster?: number) => {
  try {
    setIsLoading(true);
    const data = await apiService.getPasswords(cacheBuster);
    setPasswords(data);

    // Decide modal based on backend states
    if (hasPaid || (trialActive && trialAcknowledged)) {
      // setShowReverifyPinModal(true);
      setShowPayModal(false);
    } else if (!hasPaid && trialActive && !trialAcknowledged) {
      // setShowTrialModal(true);
      setShowPayModal(false);
    // } else {
    //   setShowReverifyPinModal(false);
    //   setShowPayModal(true);
    // }
}

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load passwords');
    setShowReverifyPinModal(false);
    setShowPayModal(true);
  } finally {
    setIsLoading(false);
  }
};


  // ----------------------------
  // Payment check
  // ----------------------------





 const checkPaymentStatus = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User not authenticated');

    const response = await fetch('/api/auth/check-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to check payment status');
    const data = await response.json();

    // Update states from backend
    setHasPaid(data.hasPaid);
    setTrialActive(data.isTrialActive);
    setTrialExpired(data.isTrialExpired);

    // Reset all modals first
    setShowPayModal(false);
    setShowOnlyPayModal(false);
    setShowTrialModal(false);
    setShowReverifyPinModal(false);

    // --- Modal Flow ---
    // 1. New user (not started trial, not paid)
    if (!data.hasPaid && !data.isTrialActive && !data.isTrialExpired) {
      setShowPayModal(true); // Pay modal with trial button
      return;
    }

    // 2. In trial (trial started but unpaid)
    if (!data.hasPaid && data.isTrialActive && !data.isTrialExpired) {
       if (!isReverified) {
        setShowReverifyPinModal(true); // After acknowledgment, show PIN modal if not reverified
      }
      return;
    }

    // 3. Trial expired, unpaid
    if (!data.hasPaid && !data.isTrialActive && data.isTrialExpired) {
      setShowOnlyPayModal(true); // Pay modal, no trial button
      return;
    }

    // 4. Trial expired, paid OR 5. Paid but no trial (rare but valid)
    if (data.hasPaid) {
      if (!isReverified) {
        setShowReverifyPinModal(true); // Paid users must reverify PIN if not done
      }
      // else: full access, no modal
      return;
    }

    // Fallback: show pay modal
    setShowPayModal(true);

  } catch (err) {
    console.error('Error checking payment status:', err);
    setHasPaid(false);
    setShowPayModal(true);
    setShowOnlyPayModal(false);
    setShowTrialModal(false);
    setShowReverifyPinModal(false);
  } finally {
    setPaymentChecked(true);
  }
};

  const handleStartTrial = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User not authenticated');

    const response = await fetch('/api/auth/start-trial/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to start trial');

    // Persist trial state
    setTrialActive(true);
    localStorage.setItem('trialActive', 'true');

    // Show trial modal for acknowledgment
    setTrialMessage('Your trial has started! You have 7 days to explore.');
    if(!trialAcknowledged) {
      setShowTrialModal(true);
    }
    setShowOnlyPayModal(false);
    setShowReverifyPinModal(false);
    setTrialAcknowledged(false); // user has not clicked OK yet

  } catch (error) {
    console.error('Error starting trial:', error);

    setTrialMessage('Failed to start the trial. Please try again.');
    // setShowTrialModal(true);
  }
};

// ----------------------------
// Trial modal OK handler
// ----------------------------
const handleTrialModalOk = () => {
  setTrialAcknowledged(true);    // User acknowledged trial
  setShowTrialModal(false);
  setShowPayModal(false);
  setShowOnlyPayModal(false);
  setShowReverifyPinModal(true); // Show PIN modal for trial users
  // Call checkPaymentStatus after state update
  setTimeout(() => checkPaymentStatus(), 0);
};

  // ----------------------------
  // Handle Pay Now
  // ----------------------------
  const handlePayNow = async () => {
    try {
      if (!(window as any).Razorpay) {
        alert('Razorpay SDK failed to load.');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const orderResponse = await fetch('/api/auth/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          ...paymentFormData,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error('Failed to create order');

      const { orderId, key } = orderData;

      const options = {
        key,
        amount: paymentFormData.amount * 100, // dynamic
        currency: 'INR',
        name: 'Vaultence',
        description: 'Secure Payment Gateway',
        order_id: orderId,
        prefill: paymentFormData,
        theme: { color: '#0f172a' },
        handler: async (response: any) => {
          try {
            const res = await fetch('/api/auth/payment-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            const result = await res.json();
            if (result.success) {
              setHasPaid(true);
              setShowPayModal(false);
              localStorage.setItem('hasPaid', 'true');
              checkPaymentStatus();
              window.location.href = '/dashboard'; // ✅ full reload
            } else {
              setError(result.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError('Server error while verifying payment.');
            console.error(err);
          }
        },
        modal: {
          ondismiss: () => console.log('Payment modal closed by user'),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };



  // ----------------------------
  // Conditional rendering
  // ----------------------------
  if (!paymentChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Checking payment status...</p>
      </div>
    );
  }

if (showOnlyPayModal) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Subscription Required</h2>
          <p className="text-lg text-gray-600 mt-2">
            Your trial period has expired. Upgrade now to continue using all features.
          </p>
        </div>

        {/* Amount Card */}
        <div className="mt-8 bg-gray-50 border rounded-xl p-5 flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold text-gray-800">Total</p>
            <p className="text-sm text-gray-500">Monthly Subscription</p>
          </div>
          <p className="text-3xl font-extrabold text-green-600">₹100</p>
        </div>

        {/* Pay Button Only */}
        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={handlePayNow}
            className="w-full px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-md transition"
          >
            Proceed to Pay
          </button>
        </div>

        {/* Security Note */}
        <div className="text-center mt-6 text-sm text-gray-500">
          🔒 Secure checkout powered by our payment gateway.
        </div>
      </div>
    </div>
  );
}

if(showTrialModal) {
  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center animate-fadeIn">
      <h2 className="text-xl font-semibold mb-2">Free Trial</h2>
      <p className="text-gray-700">{trialMessage || "Loading..."}</p>

<button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={handleTrialModalOk}
            >
              OK
            </button>

    </div>
  </div>
)}



  if (showPayModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Upgrade to Premium</h2>
            <p className="text-lg text-gray-600 mt-2">
              Get unlimited access to all premium features.
            </p>
          </div>

          {/* Amount Card */}
          <div className="mt-8 bg-gray-50 border rounded-xl p-5 flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">Total</p>
              <p className="text-sm text-gray-500">Monthly Subscription</p>
            </div>
            <p className="text-3xl font-extrabold text-green-600">₹100</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handlePayNow}
              className="w-full px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-md transition"
            >
              Proceed to Pay
            </button>
            <button
              onClick={handleStartTrial}
              className="w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg shadow-md transition"
            >
              Start Free Trial (7 Days)
            </button>
          </div>

          {/* Security Note */}
          <div className="text-center mt-6 text-sm text-gray-500">
            🔒 Secure checkout powered by our payment gateway.
          </div>
        </div>
      </div>
    )}


  <Dialog open={!!error} onOpenChange={() => setError(error)}>
    <DialogContent className="rounded-2xl p-6 bg-red-50 border border-red-200">
      <DialogHeader>
        <DialogTitle className="text-red-600 text-xl font-semibold">
          Payment Failed
        </DialogTitle>
      </DialogHeader>
      <p className="text-gray-700 mt-2">
        {error}
      </p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setError(error)}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
        >
          Close
        </button>
      </div>
    </DialogContent>
  </Dialog>








  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addPassword(passwordformData);

      // setPasswords(prev => [password, ...prev]);
      setPasswordFormData({ website: '', username: '', password: '', category: 'General', notes: '' });
      setShowAddForm(false);
      loadPasswords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add password');
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setPasswordFormData({
      website: password.website,
      username: password.username,
      password: '',
      category: password.category || 'General',
      notes: password.notes || ''
    });
    setShowEditModal(true);
  };



  const handleUpdatePassword = async (e: React.FormEvent) => {
    // const data = await apiService.getPasswords({ params: { t: Date.now() } });

  e.preventDefault();
  if (!editingPassword) return;

  try {
    await apiService.updatePassword(editingPassword._id, {
      ...passwordformData,
      currentPassword,
    });

    setPasswords(prev =>
  prev.map(item =>
    item._id === editingPassword._id
      ? { ...item, ...passwordformData }
      : item
  )
);

    // ✅ Instead of just updating state manually, fetch fresh data
await loadPasswords(Date.now());
    setSuccessMessage('Password updated successfully!');
    setShowEditModal(false);
    setEditingPassword(null);
    
    setPasswordFormData({ website: '', username: '', password: '', category: '', notes: '' });
  } catch (err: any) {
    if (err.response?.status === 403 && err.response?.data?.error?.includes("Current password does not match")) {
      setError("Incorrect current password. Please try again.");
    } else if (err.response?.status === 401) {
      setError("Your session has expired. Please log in again.");
      logout();
      navigate("/login");
    } else {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  }
};



  const handleDeletePassword = async (_id: string) => {
  if (!_id) return;
  setIsDeleting(_id);
  try {
    await apiService.deletePassword(_id);

    // ✅ Fetch fresh data after deletion
await loadPasswords(Date.now());
  } catch (err) {
    console.error('Error deleting password:', err);
    setError(err instanceof Error ? err.message : 'Failed to delete password');
  } finally {
    setIsDeleting(null);
    setConfirmId(null);
  }
};



  const handleViewPassword = (passwordId: string) => {

      setConfirmId(passwordId); // store which password user wants to view
  // setShowReverifyPinModal(true); // open PIN modal
    const freshPassword = passwords.find(p => p._id === passwordId);
    if (freshPassword) {
      setViewingPassword(freshPassword);
      setShowPassword(true);
    }
  };

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 16;
    const buf = new Uint32Array(length);
    crypto.getRandomValues(buf);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += alphabet[buf[i] % alphabet.length];
    }
    setPasswordFormData({ ...passwordformData, password });
  };





  return (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
<Header
      token={localStorage.getItem("token") || ""}
      handleLogout={() => { throw new Error("Function not implemented."); }}
    />
        <main className="flex-1 px-6 py-4 md:py-6 lg:py-8">
          {/* Back Button */}
            <div className="mb-6">
        <button
          onClick={() => navigate(prevRoute)}
          className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg shadow-md hover:scale-105 transition transform duration-200"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
      {/* Header */}
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 drop-shadow">
          🔐 Password Manager
        </h1>
        <p className="text-gray-700 mt-1">Welcome, <span className="font-semibold">{user?.email}</span></p>
      </div>

      {/* Saved Passwords */}
      <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Saved Passwords</h2>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition"
          >
            + Add New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-3 text-gray-600">Loading passwords...</p>
          </div>
        ) : !passwords.length ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center border border-dashed border-gray-300">
            <p className="text-gray-500">No passwords yet. Click <strong>+ Add New</strong> to get started!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {passwords.map((password) => (
              <div
                key={password._id}
                className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition transform duration-200 group"
              >
                {/* Icon + Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${getWebsiteColor(password.website)} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {getWebsiteIcon(password.website)}
                  </div>

                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
<button
  onClick={() => {
    setConfirmId(password._id);       // store which password the user wants
    setShowReverifyPinModal(true);    // open the Reverify PIN modal
  }}
  className="hover:text-green-300"
  title="View"
>
  👁️
</button>
                    <button
                      onClick={() => handleEditPassword(password)}
                      className="hover:text-yellow-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setConfirmId(password._id)}
                      className="hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {confirmId === password._id && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
                          <h3 className="text-lg font-bold mb-3">Confirm Delete</h3>
                          <p className="text-gray-600 mb-4">Are you sure you want to delete this password?</p>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeletePassword(password._id)} // ✅ function used here
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              {isDeleting === password._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="text-sm opacity-80">Website</p>
                  <p className="font-semibold truncate">{password.website}</p>
                  <p className="text-sm opacity-80">Username</p>
                  <p className="font-semibold truncate">{password.username}</p>
                  <p className="text-sm opacity-80">Password</p>
                  <p className="font-semibold tracking-widest">••••••••</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReverifyPinModal && !pinError && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-lg">
      <h3 className="text-xl font-bold text-black mb-4">Re-enter PIN to Confirm</h3>
      <form onSubmit={validateReverifyPin} className="space-y-4">
        <input
          type="email"
          value={user?.email || ""}
          className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md cursor-not-allowed"
          disabled
        />

        <div>
          <input
            type="password"
            value={reverifyPinInput}
            maxLength={4}

            onChange={(e) => setReverifyPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {reverifyPinError && (
            <p className="text-sm text-red-600 mt-1">{reverifyPinError}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Confirm
          </Button>
        </div>
      </form>
    </div>
  </div>
)}


{showReverifyPinModal && pinError && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-red-200">
      <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
        ⚠️ Incorrect PIN
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Please re-enter your PIN to confirm access.
      </p>

      <form onSubmit={validateReverifyPin} className="space-y-4">
        <input
          type="email"
          value={user?.email || ""}
          className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
          disabled
        />

        <div>
          <input
            type="password"
            value={reverifyPinInput}
              maxLength={4}
            onChange={(e) => setReverifyPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {reverifyPinError && (
            <p className="text-sm text-red-600 mt-1">{reverifyPinError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md transition"
          >
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








        {showEditModal && (

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
                    value={passwordformData.website}
                    disabled
                    // onChange={(e) => setPasswordFormData({ ...passwordformData, website: e.target.value })}
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
                    value={passwordformData.username}
                    disabled
                    // onChange={(e) => setPasswordFormData({ ...passwordformData, username: e.target.value })}
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
                    value={passwordformData.password}
                    onChange={(e) =>
                      setPasswordFormData({ ...passwordformData, password: e.target.value })
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
                    value={passwordformData.category}
                    disabled
                    // onChange={(e) => setPasswordFormData({ ...passwordformData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes
                  </label>
                  <textarea
                    value={passwordformData.notes}
                    onChange={(e) => setPasswordFormData({ ...passwordformData, notes: e.target.value })}
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
                    value={passwordformData.website}
                    onChange={(e) => setPasswordFormData({ ...passwordformData, website: e.target.value })}
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
                    value={passwordformData.username}
                    onChange={(e) => setPasswordFormData({ ...passwordformData, username: e.target.value })}
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
                      value={passwordformData.password}
                      onChange={(e) => setPasswordFormData({ ...passwordformData, password: e.target.value })}
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
                      value={passwordformData.category}
                      onChange={(e) => setPasswordFormData({ ...passwordformData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Notes
                    </label>
                    <textarea
                      value={passwordformData.notes}
                      onChange={(e) => setPasswordFormData({ ...passwordformData, notes: e.target.value })}
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
      </main>
      <Footer />
    </div>
  );
};