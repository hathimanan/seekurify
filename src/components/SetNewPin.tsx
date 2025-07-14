import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SetNewPinProps {
  email: string;
  onPinSetSuccess: () => void;
}



export const SetNewPin: React.FC<SetNewPinProps> = ({ email, onPinSetSuccess }) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      onPinSetSuccess(); // back to dashboard or reload
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Set New PIN</h2>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <input
          type="password"
          maxLength={4}
          placeholder="New PIN"
          className="w-full border p-2 rounded mb-4"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
        />
        <input
          type="password"
          maxLength={4}
          placeholder="Confirm New PIN"
          className="w-full border p-2 rounded mb-4"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Set PIN'}
        </button>
      </form>
    </div>
  );
};