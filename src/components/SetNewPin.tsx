import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


interface DecodedToken {
  email: string;
  exp: number;
  iat: number;
}

export const SetNewPin: React.FC = () => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">


    <div>
      {/* <h2>Set Your New PIN</h2>
      <p>Token: {token}</p> */}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Set New PIN
        </h2>

        {error && <div className="text-red-600 mb-4">{error}</div>}

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
  )}
