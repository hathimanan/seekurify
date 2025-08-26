import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft } from 'lucide-react';
import Header from './ui/Header';
import Footer from './ui/Footer';


interface DecodedToken {
  email: string;
  exp: number;
  iat: number;
  newUser?: boolean; // <- added
}

interface UserProfile {
  name: string;
  email: string;
  username: string;
}

export const SetNewPin: React.FC = () => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  
  useEffect(() => {
        if (token) {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded?.email) {
          setEmail(decoded.email);
          if (!decoded.newUser) {
                setShowPinModal(true);
              }

        } else {
          setError('Invalid token. Please try again.');
          return;
        }
      }
    else if (!token) {
      setError('Token not found. Please check your email link.');
      return;
    }



    try {
      const decoded = jwtDecode<DecodedToken>(token); // ✅ Provide type
      const decodedEmail = decoded?.email;

      if (decodedEmail) {
        setEmail(decodedEmail);
      } else {
        setError('Email not found in token. Please sign up again.');
      }
    } catch (err) {
      setError('Invalid or expired token.');
    }
  }, [token]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {


      
      setIsLoading(true);
      const res = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update PIN');
      }

      // ✅ Redirect to login after setting PIN
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

 return (
  <div className="p-0">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

            <main className="flex-grow p-6 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg">
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen rounded-lg">
                  <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg shadow-md hover:scale-105 transition transform duration-200"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
      {/* 🔧 FIXED CLASSNAME HERE */}
      <div className="flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Set New PIN
          </h2>

          {error && <div className="text-red-600 mb-4">{error}</div>}

          {/* Modal to verify PIN */}
          {showPinModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-4">Verify PIN</h2>
                <input
                  type="password"
                  placeholder="Enter your PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={async () => {
                      setIsVerifying(true);
                      setError('');
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/auth/verify-pin', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            email,
                            pin: pinInput,
                          }),
                        });

                        const data = await res.json();
                        if (data.token) {
                          setShowPinModal(false);
                          // navigate('/change-password'); ✅ If needed
                        } else {
                          setError('Incorrect PIN. Please try again.');
                        }
                      } catch (err) {
                        setError('Error verifying PIN.');
                      } finally {
                        setIsVerifying(false);
                      }
                    }}
                    disabled={isVerifying}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Proceed'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <input
            type="password"
            maxLength={4}
            placeholder="New PIN"
            className="w-full border p-2 rounded mb-4"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            disabled={isLoading}
          />
          <input
            type="password"
            maxLength={4}
            placeholder="Confirm New PIN"
            className="w-full border p-2 rounded mb-4"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            disabled={isLoading}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={isLoading || !email}
          >
            {isLoading ? 'Updating...' : 'Set PIN'}
          </button>
        </form>
      </div>
    </div>
    </main>
    <Footer />
  </div>
);}
