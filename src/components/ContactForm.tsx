import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { ArrowLeft, BarChart3, FileSearch, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from '../services/api';
import { useEffect } from "react";
import { motion } from "framer-motion";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  attachment?: File | null;
}

// interface HeaderProps { 
//   token: string;
//   handleLogout: () => void;
//   profileImage?: string; // ✅ new prop
// }

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  attachment?: string;
}



const ContactForm: React.FC = () => {
const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
  subject: "",
  message: "",
  attachment: null, // ✅ initialize
});
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<string>("");
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
  const [sidebarExpanded,setSidebarExpanded] = useState(true);

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
  const newErrors: FormErrors = {};

  if (!formData.name.trim()) newErrors.name = "Name is required.";
  if (!formData.email.trim()) {
    newErrors.email = "Email is required.";
  } else if (
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
  ) {
    newErrors.email = "Enter a valid email address (e.g., test@gmail.com).";
  }
  if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
  if (!formData.message.trim()) newErrors.message = "Message cannot be empty.";

  // optional file validation (example: max 5MB, only PDF/JPG/PNG)
  if (formData.attachment) {
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(formData.attachment.type)) {
      newErrors.attachment = "Only PDF, PNG, or JPG files are allowed.";
    }
    if (formData.attachment.size > 5 * 1024 * 1024) {
      newErrors.attachment = "File size must be under 5MB.";
    }
  }

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
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("message", formData.message);
    if (formData.attachment) {
      formDataToSend.append("attachment", formData.attachment);
    }

    const res = await axios.post(`${API_BASE_URL}/contact`, formDataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data", // ✅ required for file upload
      },
    });

    setStatus(res.data.message);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      attachment: null,
    });
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
    <div className="flex-items min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      <title>Contact Us</title>
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
        profileImage={profileImage} // ✅ pass state
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

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
      <div
        onClick={() => setSidebarExpanded((s) => !s)}
        className="flex items-center justify-center mt-auto cursor-pointer bg-white/10 hover:bg-white/20 px-2 py-2 rounded-md transition relative group"
      >
        {sidebarExpanded ? "Collapse" : "Expand"}
        {!sidebarExpanded && (
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          </span>
        )}
      </div>
    </motion.aside>

     <main className="flex-grow px-4 sm:px-6 md:px-12 py-8 flex flex-col">
  {/* Back Button */}
  <div className="w-full max-w-lg mb-6 mt-4 sm:mt-6 flex justify-start">
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
    >
      <ArrowLeft className="w-5 h-5" /> Back
    </button>
  </div>

 <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-8 border border-gray-200 mx-auto">
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
              <label className="block text-sm font-semibold text-gray-600 mb-1">Message*</label>
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

<div>
  <label className="block text-sm font-semibold text-gray-600 mb-1">Attachment</label>
  <input
    type="file"
    name="attachment"
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        attachment: e.target.files?.[0] || null,
      }))
    }
    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
  />
  {errors.attachment && (
    <p className="text-sm text-red-600 mt-1">{errors.attachment}</p>
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
</div>
      <Footer />
    </div>
  );
};

export default ContactForm;
