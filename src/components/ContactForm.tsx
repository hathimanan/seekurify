import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { ArrowLeft } from "lucide-react";

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
  const [prevRoute, setPrevRoute] = useState("/homePageAfterLogin");

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
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("Error sending message.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      <Header
        token={"token"}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
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
        {/* Back Button */}


        {/* Form Card */}
        <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">Contact Us</h2>
            <p className="text-gray-500 mt-1">We’ll get back to you shortly!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {["name", "email", "subject"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-600 mb-1 capitalize">
                  {field}
                </label>
                <input
                  name={field}
                  type={field === "email" ? "email" : "text"}
                  value={(formData as any)[field]}
                  onChange={handleChange}
                  required
                  placeholder={`Enter your ${field}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl h-36 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
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
