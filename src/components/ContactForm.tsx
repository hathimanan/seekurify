import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Sending...");

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("/api/contact", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatus(res.data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("Error sending message.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 px-4 py-6 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        ⬅️ Back
      </button>

      {/* Centered Form Card */}
      <div className="flex items-center justify-center mt-10">
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-3xl p-8 border border-gray-200">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">Contact Us</h2>
            <p className="text-sm text-gray-500 mt-1">We’ll get back to you shortly!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@domain.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Subject</label>
              <input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Subject line"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md text-lg transition"
            >
              Send Message
            </button>
          </form>

          {/* Status Message */}
          {status && (
            <p className="mt-4 text-center text-sm font-medium text-gray-700">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;

