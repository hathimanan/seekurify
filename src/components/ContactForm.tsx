import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from '../services/api';
import { useEffect } from "react";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface HeaderProps { 
  token: string;
  handleLogout: () => void;
  profileImage?: string; // ✅ new prop
}


const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [status, setStatus] = useState<string>("");
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header


  useEffect(() => {
    let isMounted = true; // prevent state updates after unmount
  
    // Fetch profile image safely
    const fetchProfileImage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
  
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!res.ok) {
          console.error("Failed to fetch profile:", res.status, res.statusText);
          return;
        }
  
        const data = await res.json();
        if (isMounted && data?.profileImage) {
          setProfileImage(data.profileImage); // ✅ update state safely
        }
      } catch (err) {
        console.error("Error fetching profile image:", err);
      }
    };
  
    fetchProfileImage();
  
    return () => {
      isMounted = false;
    };
  }, []); // no token dependency needed, read it directly inside effect
  



  const validate = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
if (!formData.email.trim()) {
    newErrors.email = "Email is required.";
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
    newErrors.email = "Enter a valid email address (e.g., test@gmail.com).";
  }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message cannot be empty.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors as user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("Sending...");
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("/api/contact", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("Error sending message.");
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
        profileImage={profileImage} // ✅ pass state
      />

      <div className="w-full max-w-lg mb-6 ml-4 sm:ml-6 mt-4 sm:mt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <main className="flex-grow px-4 sm:px-6 md:px-12 py-8 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">Contact Us</h2>
            <p className="text-gray-500 mt-1">We’ll get back to you shortly!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {["name", "email", "subject"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-600 mb-1 capitalize">
                  {field}*
                </label>
                <input
                  name={field}
                  type={field === "email" ? "email" : "text"}
                  value={(formData as any)[field]}
                  onChange={handleChange}
                  placeholder={`Enter your ${field}`}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition 
                    ${errors[field as keyof FormData]
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                    }`}
                />
                {errors[field as keyof FormData] && (
                  <p className="text-sm text-red-600 mt-1">{errors[field as keyof FormData]}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message..."
                className={`w-full px-4 py-3 border rounded-xl h-36 resize-none focus:outline-none focus:ring-2 transition 
                  ${errors.message ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
                  }`}
              />
              {errors.message && (
                <p className="text-sm text-red-600 mt-1">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-lg transition-shadow shadow-md hover:shadow-lg"
            >
              Send Message
            </button>
          </form>

          {status && (
            <p className="mt-4 text-center text-sm font-medium text-gray-700">{status}</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactForm;
