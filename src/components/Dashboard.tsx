import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { API_BASE_URL } from '../services/api';
import { Logo } from './ui/logo';
import { encryptForShare } from '../utils/encryptForShare';
// import  from "../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Copy, FileSearch, BarChart3, KeyRound, ShieldCheck, Phone, Share2, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Eye, Pencil } from "lucide-react";

import { motion } from 'framer-motion';
import { set } from 'mongoose';
import AppSidebar from './ui/AppSidebar';

interface PasswordEntry {
  _id: string;
  website: string;
  username: string;
  password: string;
  currentPassword?: string;
  category: string;
  notes: string;
  createdAt: string;
  lastChanged: string;
  updatedAt?: string;
  isExpired?: boolean;
  // for payment
}

interface HeaderProps {
  token: string;
  handleLogout: () => void;
  profileImage?: string; // ✅ new prop
}



interface PaymentEntry {
  name?: string | '';
  email?: string | '';
  contact?: string | '';
  amount: number | 0;
}




// Website icons mapping
const getWebsiteIcon = (website: string) => {
  const name = website.toLowerCase();

  // Social Media
  if (name.includes("facebook")) return "f";
  if (name.includes("instagram")) return "📸";
  if (name.includes("twitter") || name.includes("x.com")) return "X";
  if (name.includes("linkedin")) return "in";

  // Email Services
  if (name.includes("gmail") || name.includes("google")) return "G";
  if (name.includes("outlook") || name.includes("microsoft")) return "O";
  if (name.includes("yahoo")) return "Y!";


  // Developer Platforms
  if (name.includes("github")) return "🐱";
  if (name.includes("gitlab")) return "🦊";

  // E-Commerce
  if (name.includes("amazon")) return "a";
  if (name.includes("flipkart")) return "F";

  // Finance / Payment Apps
  if (name.includes("paytm")) return "₹";
    if (name.includes("groww")) return "G";

  if (name.includes("phonepe")) return "P";

  // Streaming
  if (name.includes("netflix")) return "N";
  if (name.includes("hotstar")) return "H";



  // Default fallback
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
  const [showViewingPassword, setShowViewingPassword] = useState(false);
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
  const [trialPlan, setTrialPlan] = useState<string>('free');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showOnlyPayModal, setShowOnlyPayModal] = useState(false);
  const [isTrialExpired, setTrialExpired] = useState(false);
  const [showReuseWarning, setShowReuseWarning] = useState(false);
  const [trialAcknowledged, setTrialAcknowledged] = useState(false);
  const location = useLocation();
  const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
  const [pinAction, setPinAction] = useState<"view" | "edit" | "delete" | null>(null);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPasswords, setFilteredPasswords] = useState(passwords);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [passwordToExpire, setPasswordToExpire] = useState<PasswordEntry | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<any>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState(15); // minutes
  const [isSharing, setIsSharing] = useState(false);
  const [isPlanLimitReached, setIsPlanLimitReached] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [expiredPassword, setExpiredPassword] = useState<PasswordEntry | null>(null);
  const [editPasswordId, setEditPasswordId] = useState<string | null>(null);
  const [showPayModalWithoutFreePlan, setShowPayModalWithoutFreePlan] = useState(false);
  const [pinverificationEnabled, setPinVerificationEnabled] = useState<boolean | null>(null);
  const totalPasswords = filteredPasswords.length;
  const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState<boolean>(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  const DAYS_90 = 90;
  const now = Date.now();

  const oldPasswords = filteredPasswords.filter(p => {
    if (!p.updatedAt) return false;  // skip if no timestamp
    const lastUpdated = new Date(p.updatedAt).getTime();
    const ageInDays = (now - lastUpdated) / (1000 * 60 * 60 * 24);
    return ageInDays > DAYS_90;
  }).length;

  const strongPasswords = filteredPasswords.filter(p => p.password.length > 15).length;
  const websiteCountMap: Record<string, number> = {};

  filteredPasswords.forEach(p => {
    if (p.website) {
      websiteCountMap[p.website] = (websiteCountMap[p.website] || 0) + 1;
    }
  });
  const mostUsedWebsites = Object.keys(websiteCountMap).length > 0
    ? Math.max(...Object.values(websiteCountMap))
    : 0;
  const weakPasswords = filteredPasswords.filter(p => p.password.length <= 5).length;

  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000; // 90 days in ms

  const passwordsChanged90Days = filteredPasswords.filter(p => {
    if (!p.lastChanged) return false;

    let lastChangedTime: number;

    if (typeof p.lastChanged === "string") {
      const d = new Date(p.lastChanged);
      if (isNaN(d.getTime())) return false;
      lastChangedTime = d.getTime();
    } else if (typeof p.lastChanged === "number") {
      lastChangedTime = p.lastChanged;
    } else {
      // any other type is ignored
      return false;
    }

    return lastChangedTime >= ninetyDaysAgo && lastChangedTime <= now;
  }).length;




  const navigate = useNavigate();

  const handleReverifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
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


      if (data.token) {
        setIsReverified(true);
        setShowReverifyPinModal(false);
        setPinError(false);
        setReverifyPinInput("");



        // ✅ Call handleViewPassword automatically if a password was requested
        if (confirmId) {
          if (pinAction === "view") {
            handleViewPassword(confirmId);
          } else if (pinAction === "edit") {
            const pwdToEdit = passwords.find(p => p._id === confirmId);
            if (pwdToEdit) {
              setEditingPassword(pwdToEdit);
              setPasswordFormData({
                website: pwdToEdit.website,
                username: pwdToEdit.username,
                // Do NOT pre-fill the "New Password" field for security UX
                password: '',
                category: pwdToEdit.category,
                notes: pwdToEdit.notes,
              });
              setCurrentPassword(''); // ensure current password input is cleared when opening edit
              setShowEditModal(true); // user can now edit and THEN call handleUpdatePassword on submit
            }
          }

          else if (pinAction === "delete") {

            setShowDeleteConfirmationModal(true);

          }
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




  // ==========================================
// 1️⃣ Load Feature Flags FIRST (runs once)
// ==========================================
useEffect(() => {
  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      const data = await res.json();
      
      console.log('✅ Feature flags loaded:', data);
      setPinVerificationEnabled(data.pinVerificationPasswordManager === true);
      
    } catch (err) {
      console.error("❌ Failed to load feature flags:", err);
      setPinVerificationEnabled(false);
    }
  };


  

  fetchFeatureFlags();
}, []);


useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch feature flags');
        }
        
        const data = await res.json();
        
        console.log('✅ Header feature flags loaded:', data);
        setPhishingDetectorEnabled(data.phishingDetectorEnabled === true);
        
      } catch (err) {
        console.error("❌ Failed to load header feature flags:", err);
        setPhishingDetectorEnabled(false); // Safe default
      } finally {
        setFeaturesLoaded(true);
      }
    };

    fetchFeatureFlags();
  }, []);


// ==========================================
// 2️⃣ Initialize App Data (runs once)
// ==========================================
useEffect(() => {
  let isMounted = true;

  const initialize = async () => {
    if (!isMounted) return;

    setIsLoading(true);

    try {
      // 1. Check payment status
      const planInfo = await checkPaymentStatus();
      const currentPlan = planInfo || localStorage.getItem('plan') || 'free';

      // 2. Get token
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // 3. Fetch profile image
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.profileImage) {
            setProfileImage(data.profileImage);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile image:", err);
      }

      // 4. Fetch passwords
      try {
        const res = await fetch("/api/passwords", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        
        if (isMounted) {
          setPasswords(data);
          const totalPasswords = data.length;
          setIsPlanLimitReached(currentPlan === 'free' && totalPasswords >= 3);

          console.log('✅ Plan initialized:', { 
            currentPlan, 
            totalPasswords, 
            isPlanLimitReached: currentPlan === 'free' && totalPasswords >= 3 
          });

          // Check if any password is expired
          const expired = data.find((p: PasswordEntry) => p.isExpired);
          if (expired) {
            setExpiredPassword(expired);
            setShowExpiryModal(true);
            
            // 🔒 prevent other modals when showing expiry
            setShowPayModal(false);
            setShowTrialModal(false);
            setShowOnlyPayModal(false);
            setShowReverifyPinModal(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch passwords:", err);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  initialize();

  return () => {
    isMounted = false;
  };
}, []); // ✅ Empty deps - run once on mount

// ==========================================
// 3️⃣ Show PIN Modal When Ready
// ==========================================
useEffect(() => {
  // Wait for both feature flags and payment status to load
  if (pinverificationEnabled === null || !paymentChecked) {
    console.log('⏳ Waiting for feature flags and payment status...');
    return;
  }

  // Don't show PIN modal if expiry modal is showing
  if (showExpiryModal) {
    console.log('⚠️ Expiry modal active, skipping PIN modal');
    return;
  }

  const needsPin = shouldRequirePin();
  
  console.log('🔐 PIN check:', {
    pinverificationEnabled,
    isReverified,
    hasPaid,
    trialActive,
    showExpiryModal,
    needsPin
  });

  // Show PIN modal if needed and not already shown
  if (needsPin && !showReverifyPinModal && !isReverified) {
    console.log('✅ Showing PIN modal');
    setShowReverifyPinModal(true);
  }
}, [
  pinverificationEnabled, 
  paymentChecked, 
  hasPaid, 
  trialActive, 
  isReverified,
  showExpiryModal // Add this dependency
]);

// ==========================================
// 4️⃣ Update Form When Editing Password
// ==========================================
useEffect(() => {
  if (editingPassword) {
    setPasswordFormData({
      website: editingPassword.website || '',
      username: editingPassword.username || '',
      password: '', // 🔐 never prefill password
      category: editingPassword.category || '',
      notes: editingPassword.notes || '',
    });

    setCurrentPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  }
}, [editingPassword]);

// ==========================================
// 5️⃣ Filter Passwords Based on Search
// ==========================================
useEffect(() => {
  if (!searchQuery.trim()) {
    setFilteredPasswords(passwords);
  } else {
    const query = searchQuery.toLowerCase();
    const filtered = passwords.filter((p) =>
      p.website.toLowerCase().includes(query) ||
      p.username.toLowerCase().includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query))
    );
    setFilteredPasswords(filtered);
  }
}, [searchQuery, passwords]);

// ==========================================
// 6️⃣ Prevent Body Scroll When Modal Open
// ==========================================
useEffect(() => {
  const modalOpen = 
    showPassword || 
    showEditModal || 
    showAddForm || 
    showReverifyPinModal || 
    showShareModal || 
    showCopyModal || 
    showDeleteConfirmationModal || 
    showExpiryModal || 
    showPayModal || 
    showTrialModal || 
    showReuseWarning;
    
  if (modalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  
  return () => { 
    document.body.style.overflow = ''; 
  };
}, [
  showPassword, 
  showEditModal, 
  showAddForm, 
  showReverifyPinModal, 
  showShareModal, 
  showCopyModal, 
  showDeleteConfirmationModal, 
  showExpiryModal, 
  showPayModal, 
  showTrialModal, 
  showReuseWarning
]);

// ==========================================
// Helper Functions
// ==========================================
const shouldRequirePin = () => {
  // Don't require PIN if feature flag isn't loaded yet
  if (pinverificationEnabled === null) {
    return false;
  }

  // Only require PIN if:
  // 1. Feature is enabled
  // 2. User hasn't been reverified yet
  // 3. User is either paid OR on active trial
  const result = (
    pinverificationEnabled === true &&
    !isReverified &&
    (hasPaid || trialActive)
  );

  return result;
};


// Current (correct name, correct implementation)
const toggleShowPassword = () => setShowViewingPassword((prev) => !prev);

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


  const handleClose = () => {
    setShowPassword(false);
    setViewingPassword(null);
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
        // user has access — no payment modals

      } else if (!hasPaid && trialActive && !trialAcknowledged) {
        // trial in progress but not acknowledged — trial modal flow handled elsewhere

        // setShowTrialModal(true);
      } else {
        // unpaid and no trial — show pay modal
        // setShowPayModal(true);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passwords');
      setShowReverifyPinModal(false);
      // setShowPayModal(true);
    } finally {
      setIsLoading(false);
    }
  };


  // ----------------------------
  // Payment check
  // ----------------------------





const checkPaymentStatus = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/check-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to check payment status');

    const data = await response.json();

    // Save backend plan and payment info
    const backendPlan = data.plan || 'free';
    setSelectedPlan(backendPlan);
    localStorage.setItem('plan', backendPlan);
    setHasPaid(data.hasPaid);
    setTrialActive(data.isTrialActive);
    setTrialExpired(data.isTrialExpired);

    console.log('💰 Payment status:', {
      plan: backendPlan,
      hasPaid: data.hasPaid,
      trialActive: data.isTrialActive,
      trialExpired: data.isTrialExpired
    });

    // Handle trial expired (ONLY show payment modal, not PIN modal)
    if (!data.hasPaid && data.isTrialExpired) {
      setShowOnlyPayModal(true);
    }

    return backendPlan;
  } catch (err) {
    console.error('❌ Payment status error:', err);
    return null;
  } finally {
    setPaymentChecked(true);
  }
};



  const handleStartTrial = async (plan: 'free' | 'pro' | 'premium') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/start-trial/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to start trial');

      setTrialActive(true);
      setSelectedPlan(plan);
      setTrialPlan(plan);

      localStorage.setItem('trialActive', 'true');
      localStorage.setItem('trialPlan', plan);
      // localStorage.setItem('plan', plan);

      setTrialMessage(`Your ${plan.toUpperCase()} trial has started! You have 7 days.`);
      setShowTrialModal(true);

    } catch (err) {
      console.error('Error starting trial:', err);
      setTrialMessage('Failed to start the trial. Try again.');
    }
  };


  // ----------------------------
  // Trial modal OK handler
  // ----------------------------
  const handleTrialModalOk = () => {
    setTrialAcknowledged(true);
    setShowTrialModal(false);
    setShowReverifyPinModal(true);
  };


  // Activate a trial for a specific plan (free or pro). The backend will record the plan and trial period.
  const handleTryFree = (plan: 'free') => {
    // delegate to API call
    handleStartTrial(plan);
  };

  // Select a paid plan and immediately start the payment flow using Razorpay.
  const handleSelectPlanForPurchase = (plan: 'pro' | 'premium' | 'business') => {
    // Default to the minimum price in the visible range for each plan
    const amountMap: Record<string, number> = { pro: 199, premium: 499, business: 1499 };
    const planAmount = amountMap[plan] || paymentFormData.amount;
    setPaymentFormData(prev => ({ ...prev, amount: planAmount }));
    setSelectedPlan(plan);
    console.log("Selected plan for purchase:", plan, "Amount:", planAmount);
    // Close the pricing overlay and start payment for the selected plan
    setShowPayModal(false);
    handlePayNow(planAmount);
  };

  const PasswordExpiryModal = ({
    password,
    onClose,
    onUpdate,
  }: {
    password: PasswordEntry;
    onClose: () => void;
    onUpdate: (password: PasswordEntry) => void;
  }) => {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">

          <h2 className="text-2xl font-bold text-red-600 text-center">
            Password Expired ⚠️
          </h2>

          <p className="mt-4 text-gray-700 text-center">
            The password for
            <span className="font-semibold"> {password.website}</span> has expired.
            Please update it to stay secure.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="w-1/2 py-2 rounded-xl border border-gray-300 hover:bg-gray-100"
            >
              Later
            </button>

            <button
              onClick={() => {
                onClose();
                onUpdate(password); // 🔥 OPEN EDIT MODAL
              }}
              className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Update Now
            </button>
          </div>

        </div>
      </div>
    );
  };


  const handleOpenEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);   // 🎯 exact password
    setShowEditModal(true);
  };

  // ----------------------------
  // Handle Pay Now
  // ----------------------------
  const handlePayNow = async (amountOverride?: number) => {
    try {
      if (!(window as any).Razorpay) {
        alert('Razorpay SDK failed to load.');
        return;
      }

      const amountToUse = amountOverride ?? paymentFormData.amount;

      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const orderResponse = await fetch(`${API_BASE_URL}/auth/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          ...paymentFormData,
          amount: amountToUse,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error('Failed to create order');
      const plan = selectedPlan; // Capture selected plan here
      const { orderId, key } = orderData;

      const options = {
        key,
        amount: amountToUse * 100, // amount in paise
        currency: 'INR',
        name: 'Seekurify',
        description: 'Secure Payment Gateway',
        order_id: orderId,
        prefill: { ...paymentFormData, amount: amountToUse },
        theme: { color: '#0f172a' },
        // Inside options.handler
        handler: async (response: any) => {
          // Use 'selectedPlan' which was set when the user clicked the pricing card
          const planToSubmit = selectedPlan;
          try {
            const res = await fetch(`${API_BASE_URL}/auth/payment-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                ...response, // includes razorpay_order_id, etc.
                plan: planToSubmit // 🎯 CRITICAL: This must be 'pro', 'premium', or 'business'
              }),
            });

            const result = await res.json();
            if (result.success) {
              localStorage.setItem('plan', result.plan); // Use what the server confirmed
              window.location.href = '/dashboard';
            }

            else {
              setError(result.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError('Server error while verifying payment.');
          }
        },
        modal: {
          ondismiss: () => { },
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

  if (showExpiryModal && expiredPassword) {
    return (
      <PasswordExpiryModal
        password={expiredPassword}
        onClose={() => setShowExpiryModal(false)}
        onUpdate={handleOpenEditPassword}
      />
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
              onClick={() => handlePayNow}
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

  if (showTrialModal) {
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
    )
  }

  // Show pay modal as a full-screen overlay (take precedence over page content)
  if (showPayModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8 relative animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowPayModal(false);
              navigate(-1);
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
          >
            ✕
          </button>

          <h2 className="text-4xl font-bold text-center mb-12">Pricing Plans</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className={`rounded-xl shadow p-6 flex flex-col transition-all duration-300 ${passwords.length > 3 ? 'opacity-30 bg-gray-50 pointer-events-none' : 'bg-white'}`}>
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-4xl font-bold mb-2">₹0<span className="text-lg font-normal">/mo</span></p>

              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✔ Basic password vault</li>
                <li>✔ Limited passwords</li>
                <li>✔ No SIEM logs</li>
              </ul>

              <button
                onClick={() => handleTryFree('free')}
                disabled={passwords.length > 3}
                className={`mt-auto w-full border py-2 rounded-lg transition ${passwords.length > 3
                  ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'border-purple-600 text-purple-600 hover:bg-purple-50'
                  }`}
              >
                {passwords.length > 3 ? 'Limit Reached' : 'Try Free'}
              </button>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="bg-purple-600 text-white rounded-xl shadow-xl p-6 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>

              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-2">₹199–299<span className="text-lg font-normal">/mo</span></p>

              <ul className="space-y-2 mb-6">
                <li>✔ Unlimited passwords</li>
                <li>✔ 2FA security</li>
                <li>✔ Breach alerts</li>
                <li>✔ Basic SIEM summary</li>
              </ul>

              <button onClick={() => handleSelectPlanForPurchase('pro')} className="w-full bg-purple-800 py-2 rounded-lg hover:bg-purple-900">
                Buy Now
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Premium</h3>
              <p className="text-4xl font-bold mb-2">₹499–799<span className="text-lg font-normal">/mo</span></p>

              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✔ File/URL scanning</li>
                <li>✔ Full SIEM dashboards</li>
                <li>✔ Anomaly alerts</li>
                <li>✔ PIN/OTP security</li>
                <li>✔ Device logs</li>
              </ul>

              <button onClick={() => handleSelectPlanForPurchase('premium')} className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Get Started
              </button>
            </div>

            {/* Business Plan */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Business</h3>
              <p className="text-4xl font-bold mb-2">₹1499–2499<span className="text-lg font-normal">/team/mo</span></p>

              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✔ Admin dashboard</li>
                <li>✔ Team vaults</li>
                <li>✔ Policy enforcement</li>
                <li>✔ Audit logs</li>
                <li>✔ Incident reports</li>
              </ul>

              <button onClick={() => navigate('/contact')} className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (showPayModalWithoutFreePlan) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 relative animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowPayModal(false);
              navigate(-1);
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
          >
            ✕
          </button>

          <h2 className="text-4xl font-bold text-center mb-12">Pricing Plans</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


            {/* Pro Plan (Featured) */}
            <div className="bg-purple-600 text-white rounded-xl shadow-xl p-6 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>

              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-2">₹199–299<span className="text-lg font-normal">/mo</span></p>

              <ul className="space-y-2 mb-6">
                <li>✔ Unlimited passwords</li>
                <li>✔ 2FA security</li>
                <li>✔ Breach alerts</li>
                <li>✔ Basic SIEM summary</li>
              </ul>

              <button onClick={() => handleSelectPlanForPurchase('pro')} className="w-full bg-purple-800 py-2 rounded-lg hover:bg-purple-900">
                Buy Now
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Premium</h3>
              <p className="text-4xl font-bold mb-2">₹499–799<span className="text-lg font-normal">/mo</span></p>

              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✔ File/URL scanning</li>
                <li>✔ Full SIEM dashboards</li>
                <li>✔ Anomaly alerts</li>
                <li>✔ PIN/OTP security</li>
                <li>✔ Device logs</li>
              </ul>

              <button onClick={() => handleSelectPlanForPurchase('premium')} className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Get Started
              </button>
            </div>

            {/* Business Plan */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Business</h3>
              <p className="text-4xl font-bold mb-2">₹1499–2499<span className="text-lg font-normal">/team/mo</span></p>

              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✔ Admin dashboard</li>
                <li>✔ Team vaults</li>
                <li>✔ Policy enforcement</li>
                <li>✔ Audit logs</li>
                <li>✔ Incident reports</li>
              </ul>

              <button onClick={() => navigate('/contact')} className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }







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
    const currentPlan = selectedPlan || localStorage.getItem('plan') || 'free';
    console.log('🧪 Add password check:', { currentPlan, passwordsLength: passwords.length });

    if (currentPlan === 'free' && passwords.length >= 3) {
      setShowPlanLimitModal(true);
      return;
    }

    if (checkPasswordReuse(passwordformData.password)) {
      setShowReuseWarning(true); // 👈 open modal instead of alert
      return;
    }

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





  const handleUpdatePassword = async (e: React.FormEvent) => {
    // const data = await apiService.getPasswords({ params: { t: Date.now() } });
    e.preventDefault();

    if (
      checkPasswordReuse(passwordformData.password) &&
      passwordformData.password !== currentPassword
    ) {
      setShowReuseWarning(true); // 👈 open modal instead of aler
      return;
    }

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
        navigate("/HomePageBeforeLogin");
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

      // Optimistically update UI: remove from local state immediately to avoid stale display
      setPasswords((prev) => prev.filter((p) => p._id !== _id));
      setFilteredPasswords((prev) => prev.filter((p) => p._id !== _id));

      // If the currently viewing password was deleted, close the view modal
      if (viewingPassword && viewingPassword._id === _id) {
        setShowPassword(false);
        setViewingPassword(null);
      }

      // Refresh from server to ensure full consistency
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
      setShowPassword(true);               // open view modal
      setShowViewingPassword(false);       // start masked by default
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

  // Inside your component

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id); // store the copied card's ID
      setTimeout(() => setCopied(null), 2000); // hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };



  // 🧩 Password Reuse Detection
  const checkPasswordReuse = (newPassword: string) => {
    if (!newPassword || !Array.isArray(passwords)) return false;
    return passwords.some(
      (entry) => entry.password.trim() === newPassword.trim()
    );
  };

  const handleSharePassword = async () => {
    if (!selectedPassword) return;

    setIsSharing(true);
    setError('');
    setSuccessMessage('');

    try {
      const plaintext = selectedPassword.password;
      const secret = crypto.randomUUID(); // client-side decryption secret

      // Derive key using the secret
      const encrypted = await encryptForShare(plaintext, secret);

      // Create share on backend (no per-share PIN; verification will use the creator's account PIN)
      const res = await apiService.createPasswordShare(selectedPassword._id, {
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        salt: encrypted.salt, // persist salt server-side
        expiresAt: new Date(Date.now() + shareExpiry * 60 * 1000).toISOString(),
        metadata: {
          website: selectedPassword.website,
          username: selectedPassword.username,
        },
        // no `pin` field -> use stored account PIN for verification
      });

      const shareLink = `${window.location.origin}/share/${res.shareId}#${secret}`;
      setShareLink(shareLink);

      try {
        await navigator.clipboard.writeText(shareLink);
        setSuccessMessage(`Share link copied! Use your account PIN to verify.`);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
        setSuccessMessage(`Share link generated — use your account PIN to verify (copy manually)`);
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };



  const handleLogout = async () => {
    try {
      // Call backend to clear cookies (if using httpOnly or session cookies)
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // important to include cookies
      });
    } catch (err) {
      console.error('Failed to call logout endpoint', err);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Redirect to login
      navigate('/login');
    }
  };
  const cardCount = passwords.length;
  const gridColsClass = cardCount === 1
    ? 'grid-cols-1' // Base is 1
    : cardCount === 2
      ? 'lg:grid-cols-2' // Force 2 columns on large screens
      : 'lg:grid-cols-3'; // Default 3 columns
  const token = localStorage.getItem('token');
  const plan = localStorage.getItem('plan');

  return (

    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <title>Password Manager</title>

      <Header
        token={token || ""}
        handleLogout={handleLogout}
        profileImage={profileImage} // ✅ pass state
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />


      <title> Password Manager </title>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />


        <div className="mt-6 ml-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <br />
        </div>


        <main className="flex-1 px-6 py-4 md:py-6 lg:py-8">
          {/* Back Button */}



          {/* Header */}
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 drop-shadow">
              🔐 Password Manager
            </h1>
            <p className="text-gray-700 mt-1">Welcome, <span className="font-semibold">{user?.email}</span></p>
          </div>


          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Passwords Stored */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-extrabold">{totalPasswords}</div>
              <div className="mt-2 text-lg font-medium">Total Passwords</div>
            </div>

            {/* Total Strong Passwords */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-extrabold">{strongPasswords}</div>
              <div className="mt-2 text-lg font-medium">Strong Passwords</div>
            </div>



            {/* Total Weak Passwords */}
            <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-extrabold">{weakPasswords}</div>
              <div className="mt-2 text-lg font-medium">Weak Passwords</div>
            </div>

            {/* Passwords Changed in Last 90 Days */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-extrabold">{passwordsChanged90Days}</div>
              <div className="mt-2 text-lg font-medium">Changed in 90 Days</div>
            </div>
          </div>
          {/* Plan Status Card */}




          <div className={`bg-gradient-to-br ${plan === 'free'
            ? 'from-orange-400 to-orange-600'
            : 'from-emerald-400 to-emerald-600'
            } rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
            <div className="text-3xl font-extrabold">{plan === 'free' ? 'FREE' : 'PREMIUM'}</div>
            <div className="mt-1 text-sm font-medium opacity-90">
              {plan === 'free'
                ? 'FREE'
                : 'PREMIUM'
              }
            </div>
          </div>


          <br />


          {/* Saved Passwords */}
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Saved Passwords</h2>
              <Button
                onClick={() => setShowAddForm(true)}
                className={`px-5 py-2 rounded-xl shadow-md transition ${isPlanLimitReached
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg'
                  }`}
              >
                {isPlanLimitReached ? '💎 Upgrade to Add More' : '+ Add New'}
              </Button>
            </div>




            {/* 🔍 Search / Filter Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search passwords (by website, username, or notes)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-10">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-3 text-gray-600">Loading passwords...</p>
              </div>
            ) : filteredPasswords.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center border border-dashed border-gray-300">
                <p className="text-gray-500">
                  {searchQuery
                    ? `No results found for "${searchQuery}".`
                    : `No passwords yet. Click + Add New to get started!`}
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 ${gridColsClass}`}>
                {filteredPasswords.map((password) => (
                  <div
                    key={password._id}
                    className={`
        w-full 
        bg-gradient-to-br ${password.password.length <= 5
                        ? 'from-red-400 to-red-600'
                        : 'from-blue-400 to-blue-600'
                      }
        text-white 
        rounded-3xl 
        p-6 
        shadow-lg 
        hover:shadow-xl 
        hover:scale-105 
        transition-all 
        duration-300 
        transform 
        group
        ${cardCount === 1 ? 'col-span-full' : ''} 
      `}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`
            w-14 h-14 
            ${getWebsiteColor(password.website)} 
            rounded-xl 
            flex items-center justify-center 
            text-white font-semibold text-xl 
            shadow-lg
          `}
                      >
                        {getWebsiteIcon(password.website)}
                      </div>

                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                        <div className="flex gap-3">
                          {/* Copy Button with Tooltip */}

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="hover:bg-blue-100 hover:text-blue-600 rounded-full transition"
                                  onClick={() => handleCopy(password.password, password._id)}                                >
                                  <Copy />
                                </Button>

                                {copied === password._id && (
                                  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                                    <div className="bg-white text-green-700 px-5 py-4 rounded-2xl shadow-2xl text-sm font-medium animate-fadeInOut">
                                      ✅ Password successfully copied to clipboard!
                                    </div>
                                  </div>
                                )}



                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Password</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="hover:bg-green-100 hover:text-green-600 rounded-full transition"
        onClick={() => {
          setConfirmId(password._id);
          setPinAction("view");

          if (shouldRequirePin()) {
            console.log('🔒 PIN required for viewing');
            setShowReverifyPinModal(true);
          } else {
            console.log('✅ No PIN required, showing password directly');
            handleViewPassword(password._id);
          }
        }}
      >
        <Eye className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>View Password</TooltipContent>
  </Tooltip>
</TooltipProvider>

  <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="hover:bg-yellow-100 hover:text-yellow-600 rounded-full transition"
        onClick={() => {
          setConfirmId(password._id);
          setPinAction("edit");

          if (shouldRequirePin()) {
            console.log('🔒 PIN required for editing');
            setShowReverifyPinModal(true);
          } else {
            console.log('✅ No PIN required, opening edit modal directly');
            const pwdToEdit = passwords.find(p => p._id === password._id);
            if (pwdToEdit) {
              setEditingPassword(pwdToEdit);
              setPasswordFormData({
                website: pwdToEdit.website,
                username: pwdToEdit.username,
                password: '', // Never prefill
                category: pwdToEdit.category,
                notes: pwdToEdit.notes,
              });
              setCurrentPassword('');
              setShowEditModal(true);
            }
          }
        }}
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Edit Password</TooltipContent>
  </Tooltip>
</TooltipProvider>

                          {/* Delete Button */}
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="hover:bg-red-100 hover:text-red-600 rounded-full transition"
        onClick={() => {
          setConfirmId(password._id);
          setPinAction("delete");

          if (shouldRequirePin()) {
            console.log('🔒 PIN required for deleting');
            setShowReverifyPinModal(true);
          } else {
            console.log('✅ No PIN required, showing delete confirmation directly');
            setShowDeleteConfirmationModal(true);
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Delete Password</TooltipContent>
  </Tooltip>
</TooltipProvider>


                          {/* Share Button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="hover:bg-blue-100 hover:text-blue-600 rounded-full transition"
                                  onClick={() => {
                                    setConfirmId(password._id);
                                    setSelectedPassword(password);   // store full password object
                                    setShowShareModal(true);          // open share modal
                                  }}
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Share Password</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                        </div>

                        <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
                          <DialogContent className="sm:max-w-xs rounded-2xl shadow-lg border border-green-200 bg-green-50 p-6 text-center">
                            <DialogHeader>
                              <div className="flex flex-col items-center gap-3">
                                {/* ✅ Success Icon */}
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
                                  <span className="text-green-600 text-2xl">✅</span>
                                </div>

                                {/* Title */}
                                <DialogTitle className="text-lg font-semibold text-green-700">
                                  Password copied!
                                </DialogTitle>

                                {/* Subtext */}
                                <p className="text-sm text-gray-600">
                                  The password has been successfully copied to your clipboard.
                                </p>
                              </div>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>




                        {/* Delete confirmation hoisted to top-level to ensure consistent stacking and to prevent background interaction. */}
                      </div>
                    </div>

                    {/* Info */}
                    < div className="space-y-1" >
                      <p className="text-sm opacity-80">Website</p>
                      <p className="font-semibold truncate">{password.website}</p>
                      <p className="text-sm opacity-80">Username</p>
                      <p className="font-semibold truncate">{password.username}</p>
                      {/* <p className="text-sm opacity-80">Password</p>
                      <p className="font-semibold tracking-widest"></p> */}
                    </div>
                  </div>
                ))}
              </div>
            )
            }

            {showShareModal && selectedPassword && (
              <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                <DialogContent className="sm:max-w-md rounded-2xl shadow-lg border border-blue-200 bg-blue-50 p-6">
                  <DialogHeader>
                    <div className="flex flex-col items-center gap-3 text-center">
                      {/* 🔗 Icon */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
                        <span className="text-blue-600 text-2xl">🔗</span>
                      </div>

                      {/* Title */}
                      <DialogTitle className="text-lg font-semibold text-blue-700">
                        Share Password Securely
                      </DialogTitle>

                      {/* Subtext */}
                      <p className="text-sm text-gray-700">
                        Generate a time-limited, encrypted link to share this password safely.
                      </p>
                    </div>
                  </DialogHeader>

                  {/* Content */}
                  <div className="space-y-4 mt-4">
                    {error && (
                      <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md">
                        {error}
                      </div>
                    )}
                    {successMessage && (
                      <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-md">
                        {successMessage}
                      </div>
                    )}
                    {/* Password Info */}
                    <div className="bg-white rounded-xl p-3 border text-sm">
                      <p className="text-gray-500">Website</p>
                      <p className="font-semibold truncate">{selectedPassword.website}</p>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Link expiry
                      </label>
                      <select
                        value={shareExpiry}
                        onChange={(e) => setShareExpiry(Number(e.target.value))}
                        className="mt-1 w-full border border-gray-300 rounded-xl p-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={1440}>24 hours</option>
                      </select>
                    </div>

                    {/* Share Link */}
                    {shareLink && (
                      <div className="bg-white border rounded-xl p-3 text-sm break-all">
                        <p className="text-gray-500 mb-1">Secure share link</p>
                        <p className="font-mono text-xs text-gray-800">{shareLink}</p>

                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                if (shareLink) {
                                  await navigator.clipboard.writeText(shareLink);
                                  setSuccessMessage('Link copied to clipboard');
                                }
                              } catch (err) {
                                console.error('Copy failed:', err);
                                setError('Failed to copy link to clipboard');
                              }
                            }}
                          >
                            Copy link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Security Note */}
                    <div className="text-xs text-gray-600 bg-blue-100 rounded-xl p-3">
                      🔒 This link can be opened only once and expires automatically.
                      <div className="mt-2 text-xs text-gray-500">
                        Note: This share uses your account PIN for verification — please share your account PIN securely with the recipient.
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowShareModal(false);
                          setShareLink(null); // reset previous link
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleSharePassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        disabled={isSharing}
                      >
                        {isSharing ? 'Generating...' : 'Generate Link'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}


            {/* Hoisted Delete Confirmation Modal (renders once at top-level, above other modals) */}
            {showDeleteConfirmationModal && confirmId && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60">
                <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
                  <h3 className="text-lg font-bold mb-3">Confirm Delete</h3>
                  <p className="text-gray-600 mb-4">Are you sure you want to delete <strong>{passwords.find(p => p._id === confirmId)?.website || 'this password'}</strong>?</p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirmationModal(false); setConfirmId(null); }}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (confirmId) {
                          await handleDeletePassword(confirmId);
                          setShowDeleteConfirmationModal(false);
                          setShowReverifyPinModal(false);
                          setReverifyPinInput('');
                          setPinError(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      {isDeleting === confirmId ? 'Deleting...' : 'Delete'}
                    </button>

                  </div>

                </div>
              </div>
            )}

            {
              showReverifyPinModal && pinverificationEnabled === true && !pinError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-lg flex flex-col items-center">

                    <Logo />
                    {/* Modal Title */}
                    <h3 className="text-xl font-bold text-black mb-4 text-center">
                      Re-enter PIN to Confirm
                    </h3>
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
              )
            }



            <Dialog open={showReuseWarning} onOpenChange={setShowReuseWarning}>
              <DialogContent className="sm:max-w-md rounded-2xl shadow-lg border border-blue-300 bg-blue-50 p-6 text-center">
                <DialogHeader>
                  <div className="flex flex-col items-center gap-3">
                    {/* ⚠️ Warning Icon */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
                      <span className="text-blue-600 text-2xl">⚠️</span>
                    </div>

                    {/* Title */}
                    <DialogTitle className="text-lg font-semibold text-blue-700">
                      Password Reuse Detected
                    </DialogTitle>

                    {/* Subtext */}
                    <p className="text-sm text-gray-700">
                      This password is already used for another account.
                      Please choose a unique password to enhance your security.
                    </p>

                    {/* Close Button */}
                    <div className="mt-5">
                      <Button
                        onClick={() => setShowReuseWarning(false)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl shadow-md transition"
                      >
                        Okay, Got it
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>



            {
              showReverifyPinModal && pinverificationEnabled === true && pinError && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-red-200">

                    <Logo />

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
              )
            }



            {
              showPassword && viewingPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white p-6 rounded-lg w-full max-w-md">

                    <Logo />
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
                      <div className="relative">
                        <label className="block text-sm font-medium text-black mb-1">
                          Password
                        </label>



                        <input
                          type={showViewingPassword ? "text" : "password"} // toggles mask/unmask for view modal only
                          value={viewingPassword?.password || ""}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 pr-12"
                        />

                        <button
                          type="button"
                          onClick={toggleShowPassword}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          {showViewingPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {/* Close Button */}
                      <div className="flex justify-end mt-4">
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
              )
            }


            {/* Free Plan Limit Modal */}
            {showPlanLimitModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-orange-200">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-100">
                        <span className="text-2xl">💎</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Free Plan Limit Reached</h3>
                        <p className="text-sm text-orange-700 mt-1">Maximum passwords exceeded</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      Your free plan allows only <strong className="text-orange-600 font-semibold">3 passwords</strong>.
                      You've already saved {totalPasswords} passwords.
                    </p>

                    <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                      <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        🚀 Upgrade Benefits
                      </h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Unlimited password storage</li>
                        <li>• Advanced security features</li>
                        <li>• Priority support</li>
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
                    <button
                      onClick={() => setShowPlanLimitModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // setShowPlanLimitModal(false);
                        setShowPayModalWithoutFreePlan(true);

                      }}

                      // 👈 Update with your upgrade page
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-center"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            )}


            {showExpiryModal && expiredPassword && (
              <PasswordExpiryModal
                password={expiredPassword}
                onClose={() => setShowExpiryModal(false)}
                onUpdate={handleOpenEditPassword}
              />
            )}






            {
              showEditModal && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-blue-400 p-6 rounded-lg w-full max-w-md">

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
                        <label className="block text-sm font-medium text-gray-700 mt-4">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            className="mt-1 p-2 border w-full rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showCurrentPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-black mb-1">
                          New Password
                        </label>

                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordformData.password || ""}
                            onChange={(e) =>
                              setPasswordFormData({ ...passwordformData, password: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                            placeholder="Enter new password"
                            autoComplete="new-password" // 🧠 prevents browser autofill
                          />

                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {/* 
                        <Button
                          type="button"
                          onClick={() => {
                            generatePassword();
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md mt-2"
                        >
                          Generate
                        </Button> */}
                      </div>

                      <Button
                        type="button"
                        onClick={generatePassword}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md mt-2"
                      >
                        Generate
                      </Button>
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
              )
            }







            {/* Add Password Form */}
            {
              showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white p-6 rounded-lg w-full max-w-md">
                    <h3 className="text-xl font-bold text-black mb-4">Add New Password</h3>
                    <form onSubmit={handleAddPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Website/Service
                        </label>

                        <select
                          value={passwordformData.website}
                          onChange={(e) =>
                            setPasswordFormData({
                              ...passwordformData,
                              website: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                        >
                          <option value="">Select a website</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Twitter">Twitter</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Gmail">Gmail</option>
                          <option value="Outlook">Outlook</option>
                          <option value="GitHub">GitHub</option>
                          <option value="GitLab">GitLab</option>
                          <option value="Amazon">Amazon</option>
                          <option value="Flipkart">Flipkart</option>

                          <option value="Groww.in">Groww.in</option>

                          <option value="Paytm">Paytm</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="Netflix">Netflix</option>
                          <option value="Hotstar">Hotstar</option>
                          <option value="Custom">Other (Enter manually)</option>
                        </select>

                        {/* Conditional input for "Other / Custom" */}
                        {passwordformData.website === "Custom" && (
                          <input
                            type="text"
                            placeholder="Enter website name"
                            onChange={(e) =>
                              setPasswordFormData({
                                ...passwordformData,
                                website: e.target.value,
                              })
                            }
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        )}
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
                          placeholder='Enter your username'
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Password
                        </label>
                        <div className="flex space-x-2 items-center">
                          <div className="relative flex-1">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={passwordformData.password}
                              onChange={(e) =>
                                setPasswordFormData({ ...passwordformData, password: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                              placeholder="Enter your password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>

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
              )
            }

            {
              error && (
                <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                  <button
                    onClick={() => setError('')}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )
            }
          </div >
        </main >
      </div >








      <Footer />
    </div >
  );
};
