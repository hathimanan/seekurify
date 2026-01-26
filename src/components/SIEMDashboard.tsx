import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Graph from "./Graph";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { ArrowLeft, BarChart3, FileSearch, KeyRound, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "../services/api";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./ui/logo";
import { motion } from "framer-motion";
interface EventData {
  date: string;
  count: number;
  intervalStart?: string;
  category?: string;
  value: number;
  intervalend?: string;
}
interface PaymentEntry {
  name: string;
  email: string;
  contact: string;
  amount: number;
}

interface passwordHealth {
  date: string;
  category: string;
  count: number;
}

interface DeviceInfo {
  deviceId: string;
  userId: string;
  success: boolean;
  deviceType: string;
  browser: string;
  os: string;
  lastLogin: string;
  ipAddress: string;
  location?: string;
  status: 'active' | 'inactive';
}

type ModalState = "none" | "pay" | "trial" | "onlyPay" | "verifyPin" | "reVerifyPin" | null;

const SystemEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---------- User & PIN ----------
  const [pinInput, setPinInput] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tryFree, setTryFree] = useState<string | null>(null);
  const [selectPlanForPurchase, setSelectPlanForPurchase] = useState<string | null>(null);
  

  // ---------- Modal State ----------
  const [currentModal, setCurrentModal] = useState<ModalState>("none");

  const [paymentFormData, setPaymentFormData] = useState<PaymentEntry>({
    name: '',
    email: '',
    contact: '',
    amount: 100, // default amount
  });
  // ---------- Payment / Trial ----------
  const [trialActive, setTrialActive] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [trialMessage, setTrialMessage] = useState("");
  const [paymentChecked, setPaymentChecked] = useState(false);

  // ---------- Dashboard Data ----------
  const [loginEvents, setLoginEvents] = useState<EventData[]>([]);
  const [passwordChanges, setPasswordChanges] = useState<EventData[]>([]);
  const [invalidLogins, setInvalidLogins] = useState<EventData[]>([]);
  const [passwordHealth, setPasswordHealth] = useState<passwordHealth[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const [error, setError] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showOnlyPayModal, setShowOnlyPayModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showReverifyPinModal, setShowReverifyPinModal] = useState(false);
  const [isReverified, setIsReverified] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo[]>([]);
const [trialPlan, setTrialPlan] = useState<'free' | 'pro' | 'premium' | null>(null);
const [trialAcknowledged, setTrialAcknowledged] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | 'business' | null>(null);

const [pinVerificationSIEMEnabled, setPinVerificationSIEMEnabled] = useState<boolean | null>(null);
 const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState<boolean>(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);



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
  

// Add this useEffect BEFORE the main fetchData useEffect
useEffect(() => {
  const fetchFeatureFlags = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      const data = await res.json();
      
      console.log('✅ SIEM Feature flags loaded:', data);
      setPinVerificationSIEMEnabled(data.pinVerificationSIEM === true);
      
    } catch (err) {
      console.error("❌ Failed to load SIEM feature flags:", err);
      setPinVerificationSIEMEnabled(false); // Safe default
    }
  };

  fetchFeatureFlags();
}, []); // ✅ Run once on mount

// ==========================================
// 2️⃣ Fetch Data ONLY After Feature Flags Load
// ==========================================
useEffect(() => {
  // ✅ CRITICAL: Wait for feature flag to load
  if (pinVerificationSIEMEnabled === null) {
    console.log('⏳ Waiting for SIEM feature flags to load...');
    return;
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log('Token for devices fetch:', token);

      const [resProfile, resPayment, resEvents, resDevices] = await Promise.all([
        fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/auth/check-payment`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/siem-dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/auth/devices`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      console.log('Device fetch response:', {
        status: resDevices.status,
        statusText: resDevices.statusText
      });

      if (!resDevices.ok) {
        const errorText = await resDevices.text();
        console.error('Devices fetch failed:', errorText);
        setDeviceInfo([]);
      } else {
        const deviceData = await resDevices.json();
        console.log('Device data received:', deviceData);
        setDeviceInfo(deviceData.devices || []);
      }

      const profileData = await resProfile.json();
      const paymentData = await resPayment.json();
      const eventsData = await resEvents.json();

      if (profileData?.profileImage) {
        setProfileImage(profileData.profileImage);
      }

      setTrialActive(paymentData.isTrialActive);
      setTrialExpired(paymentData.isTrialExpired);
      setHasPaid(paymentData.hasPaid);

      setLoginEvents(eventsData.loginEvents || []);
      setPasswordChanges(eventsData.passwordChanges || []);
      setInvalidLogins(eventsData.invalidLogins || []);
      console.log('Password health data received from API:', eventsData.passwordHealth);
      setPasswordHealth(eventsData.passwordHealth || []);

      // ---------- Determine Modal (with Feature Flag) ----------
      console.log('🔐 SIEM Modal Decision:', {
        hasPaid: paymentData.hasPaid,
        isTrialActive: paymentData.isTrialActive,
        isTrialExpired: paymentData.isTrialExpired,
        pinVerified: pinVerified,
        pinVerificationSIEMEnabled, // Now guaranteed to be loaded
      });

      // ✅ Check if PIN verification is enabled for SIEM
      if (pinVerificationSIEMEnabled === true) {
        console.log('🔒 PIN verification ENABLED for SIEM');
        
        if (pinError) {
          setCurrentModal("reVerifyPin");
        } else if (paymentData.hasPaid) {
          setCurrentModal("verifyPin");
        } else if (paymentData.isTrialActive) {
          setCurrentModal("verifyPin");
        } else if (paymentData.isTrialExpired) {
          setCurrentModal("onlyPay");
        } else {
          setCurrentModal("pay");
        }
      } else {
        console.log('✅ PIN verification DISABLED for SIEM, skipping PIN modal');
        setPinVerified(true); // Auto-verify
        
        // Still check payment status
        if (paymentData.isTrialExpired && !paymentData.hasPaid) {
          setCurrentModal("onlyPay");
        } else if (!paymentData.hasPaid && !paymentData.isTrialActive) {
          setCurrentModal("pay");
        } else {
          setCurrentModal("none"); // Full access
        }
      }

    } catch (err) {
      console.error(err);
      setCurrentModal("pay");
      setError("Failed to fetch dashboard data");
    }
  };

  fetchData();
}, [pinVerificationSIEMEnabled]);


// Add this helper function after your state declarations
const shouldRequirePinForSIEM = () => {
  if (pinVerificationSIEMEnabled === null) {
    console.log('⏳ SIEM feature flag not loaded yet');
    return false;
  }

  const result = (
    pinVerificationSIEMEnabled === true &&
    !pinVerified &&
    (hasPaid || trialActive)
  );

  console.log('🔐 SIEM PIN check:', {
    pinVerificationSIEMEnabled,
    pinVerified,
    hasPaid,
    trialActive,
    result
  });

  return result;
};

   const handleTryFree = (plan: 'free' | 'pro' = 'free') => {
    // delegate to API call
    handleStartTrial(plan);
  };

  // ---------- PIN Verification ----------
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!/^\d{4}$/.test(pinInput)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user?.email, pin: pinInput }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setPinVerified(true);
        setCurrentModal("none");
      } else {
        setPinError("Incorrect PIN. Try again.");
      }
    } catch (err) {
      console.error(err);
      setPinError("Server error. Try again.");
    }
  };

  // ---------- Payment Handlers ----------
 const handleStartTrial = async (plan: 'free' | 'pro' | 'premium' = 'free') => {
     try {
       const token = localStorage.getItem('token');
       if (!token) throw new Error('User not authenticated');
 
       const response = await fetch(`${API_BASE_URL}/auth/start-trial/`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ plan }),
       });
 
       const data = await response.json();
       if (!response.ok) throw new Error(data.message || 'Failed to start trial');
 
       // Persist trial state and plan
       setTrialActive(true);
       localStorage.setItem('trialActive', 'true');
       localStorage.setItem('trialPlan', plan);
       setTrialPlan(plan);
 
       const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Premium';
       setTrialMessage(`Your ${planLabel} trial has started! You have 7 days to explore.`);
       if (!trialAcknowledged) {
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

     const handleSelectPlanForPurchase = (plan: 'pro' | 'premium' | 'business') => {
    // Default to the minimum price in the visible range for each plan
    const amountMap: Record<string, number> = { pro: 199, premium: 499, business: 1499 };
    const planAmount = amountMap[plan] || paymentFormData.amount;
    setPaymentFormData(prev => ({ ...prev, amount: planAmount }));
    setSelectedPlan(plan);

    // Close the pricing overlay and start payment for the selected plan
    setShowPayModal(false);
    handlePayNow(planAmount);
  }; 

  const checkPaymentStatus = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/check-payment`, {
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
      setShowPayModal(true);
    } catch (err) {
      console.error('Error checking payment status:', err);
      setHasPaid(false);
      setShowOnlyPayModal(false);
      setShowTrialModal(false);
      setShowReverifyPinModal(false);
    } finally {
      setPaymentChecked(true);
    }
  };



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
        handler: async (response: any) => {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/payment-success`, {
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
              // Persist plan info locally for immediate UX; server is authoritative
              if (selectedPlan) {
                localStorage.setItem('plan', selectedPlan);
              }
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
          ondismiss: () => {},
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // ---------- Render ----------

if (!pinVerified && currentModal === "verifyPin" && pinVerificationSIEMEnabled === true) {
      return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4">
        <title>System Events Dashboard</title>
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center">
          {/* Seekurify Icon */}
          <Logo />

          {/* Modal Title */}
          <h2 className="text-3xl font-extrabold mb-6 text-center text-white drop-shadow-md">
            🔒 Enter PIN
          </h2>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
            />
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              placeholder="Enter PIN"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${pinError ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {pinError && <p className="text-red-600 text-sm">{pinError}</p>}
            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Verify
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }


if (!pinVerified && currentModal === "reVerifyPin" && pinVerificationSIEMEnabled === true) {
    return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-red-200">

        <Logo />

        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
          ⚠️ Incorrect PIN
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Please re-enter your PIN to confirm access.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <input
            type="email"
            value={user?.email || ""}
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
            disabled
          />

          <div>
            <input
              type="password"
              value={pinInput}
              maxLength={4}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter PIN"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
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
  );

  }
if (currentModal === "pay") {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={() => {
            navigate(-1)
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
        >
          ✕
        </button>

        <h2 className="text-4xl font-bold text-center mb-12">Pricing Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Free Plan */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-2">₹0<span className="text-lg font-normal">/mo</span></p>

            <ul className="space-y-2 mb-6 text-gray-700">
              <li>✔ Basic password vault</li>
              <li>✔ Limited passwords</li>
              <li>✔ No SIEM logs</li>
            </ul>

            <button onClick={() => handleTryFree?.('free')} className="mt-auto w-full border border-purple-600 text-purple-600 py-2 rounded-lg hover:bg-purple-50">
              Try Free
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

            <button onClick={() => handleTryFree?.('pro')} className="w-full bg-white text-purple-700 py-2 rounded-lg mb-2 font-semibold hover:bg-gray-100">
              Try Free
            </button> 

            <button onClick={() => handleSelectPlanForPurchase?.('pro')} className="w-full bg-purple-800 py-2 rounded-lg hover:bg-purple-900">
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

            <button onClick={() => handleSelectPlanForPurchase?.('premium')} className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
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


  if (currentModal === "onlyPay") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Subscription Expired</h2>
          <p className="mb-4">Your trial has expired. Please pay to continue.</p>
          <Button onClick={() => handlePayNow} className="bg-green-600 hover:bg-green-700 w-full">Pay ₹100</Button>
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------
  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen flex flex-col text-white">
      <Header token={localStorage.getItem("token") || ""} handleLogout={handleLogout} profileImage={profileImage} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />
      <title> System Events Dashboard</title>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarExpanded ? "18rem" : "4rem" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 flex flex-col"
        >
          {[
            { label: "Analyze Malware", path: "/malware-analysis", icon: <FileSearch className="w-5 h-5" /> },
            { label: "Password Manager", path: "/dashboard", icon: <KeyRound className="w-5 h-5" /> },
            { label: "System Events Dashboard", path: "/siem-dashboard", icon: <BarChart3 className="w-5 h-5" /> },
            { label: "Security Awareness", path: "/securityAwareness", icon: <ShieldCheck className="w-5 h-5" /> },
            { label: "Contact Us", path: "/contact", icon: <Phone className="w-5 h-5" /> },
...(phishingDetectorEnabled ? [
      { label: "Phishing Detector", path: "/detect-attacker", icon: <ShieldAlert className="w-5 h-5" /> }
    ] : [])
          ].map(({ label, path, icon }) => (
            <div
              key={path}
              onClick={() => navigate(path)}
              className="relative group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-600 transition cursor-pointer"
            >
              {icon}
              {sidebarExpanded && <span className="truncate">{label}</span>}

              {!sidebarExpanded && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {label}
                </span>
              )}
            </div>
          ))}

          {/* Expand/Collapse */}
          {/* <div
        onClick={() => setSidebarExpanded((s) => !s)}
        className="flex items-center justify-center mt-auto cursor-pointer bg-white/10 hover:bg-white/20 px-2 py-2 rounded-md transition relative group"
      >
        {sidebarExpanded ? "Collapse" : "Expand"}
        {!sidebarExpanded && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          </span>
        )}
      </div> */}
        </motion.aside>

        <div className="mt-6 ml-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>


        <main className="flex-grow px-6 py-4">

          <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-orange-600 drop-shadow-md">
            ⚡ System Event Management Dashboard ⚡
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Login Events */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col hover:scale-105 transition-transform duration-200">
              <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">🔑 Login Events</h3>
              <Graph
                title="Login Events"
                data={loginEvents.map(e => ({ date: e.date, value: e.count }))}
              />
            </div>

            {/* Password Changes */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-col hover:scale-105 transition-transform duration-200">
              <h3 className="text-white font-semibold mb-3 text-lg flex items-center gap-2">🔄 Password Changes</h3>

              <Graph
                title="Password Changes"
                data={passwordChanges.map(e => ({ date: e.date, value: e.count }))}
              />
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col hover:scale-105 transition-transform duration-200">
              <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">⚠️ Invalid Logins</h3>
              <Graph
                title="Invalid Logins"
                data={invalidLogins
                  .filter(e => e.intervalStart) // remove undefined/null entries
                  .map(e => ({
                    date: new Date(e.intervalStart ?? "").toLocaleString(), // fallback to ""
                    value: e.count
                  }))}
              />
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col hover:scale-105 transition-transform duration-200">
              <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">🔐 Password Health</h3>
       <Graph
  title="Password Health"
  type="bar"
  xKey="category"
  yKey="value"
  data={passwordHealth.map(e => ({
    category: e.category,
    value: e.count
  }))}
/>


            </div>

            {/* Device Info Card - New Addition */}
            <div className="col-span-2 bg-gray-800 rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform duration-200">
              <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                💻 Devices Login Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceInfo.map((device) => (
                  <div
                    key={device.deviceId}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-medium text-white">
                        {device.deviceType}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${device.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                        }`}>
                        {device.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>🌐 Browser: {device.browser}</p>
                      <p>🖥️ OS: {device.os}</p>
                      <p>🕒 Last Active: {new Date(device.lastLogin).toLocaleString()}</p>
                      <p>🌍 IP: {device.ipAddress}</p>
                      {device.location && <p>📍 Location: {device.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};




export default SystemEventsPage;


