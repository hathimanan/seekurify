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
    message: ""
  });

  const [status, setStatus] = useState<string>("");
    const navigate = useNavigate();
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      // const res = await fetch('/api/malware-analysis/file', {

      const res = await axios.post("/api/contact", formData);
      setStatus(res.data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("Error sending message.");
    }
  };

  return (
            <div className="p-4">
      <button
        onClick={() => navigate(-1)}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        ⬅️ Back
      </button>
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
          placeholder="Name"
        />
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
          placeholder="Email"
        />
        <input
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded"
          placeholder="Subject"
        />
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded h-32"
          placeholder="Message"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
    </div>
  );
};


export default ContactForm;
