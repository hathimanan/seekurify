import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  name: string;
  email: string;
  username: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editableUser, setEditableUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
const [showPinModal, setShowPinModal] = useState(false);
const [pinInput, setPinInput] = useState('');
const [isVerifying, setIsVerifying] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Unauthorized or failed to fetch');
        const data = await res.json();
        setUser(data);
        setEditableUser(data);
      } catch (error) {
        console.error('Fetch profile error:', error);
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!editableUser) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editableUser.name,
          username: editableUser.username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setUser(data);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (!user || !editableUser) {
    return <p className="text-center mt-20 text-gray-600 text-lg">Loading...</p>;
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        ⬅️ Back
      </button>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {initials}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Your Profile</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableUser.name}
                  onChange={(e) => setEditableUser({ ...editableUser, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium mt-1">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600">Email Address</label>
              <p className="text-gray-900 font-medium mt-1">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableUser.username}
                  onChange={(e) => setEditableUser({ ...editableUser, username: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium mt-1">{user.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600">Password</label>
              <p className="text-gray-900 font-medium mt-1">************</p>

              <button
                onClick={() => setShowPinModal(true)}  // 🔄 Show modal first
                className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-200"
              >
                Change Password &rarr;
              </button>
              {/* <button
                onClick={() => navigate('/change-password')}
                className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-200"
              >
                Change Password &rarr;
              </button> */}
            </div>


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
        {/* <button
          onClick={() => setShowPinModal(false)}
          className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
        >
          Cancel
        </button> */}
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
                  Authorization: `Bearer ${token}`, // optional if not required
                },
                body: JSON.stringify({
                  email: user?.email,
                  pin: pinInput,
                }),
              });

              const data = await res.json();
              if (data.token) {
                setShowPinModal(false);
                navigate('/change-password'); // ✅ Navigate on success
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




            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

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
                      setError('');
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
  );
};

export default Profile;
