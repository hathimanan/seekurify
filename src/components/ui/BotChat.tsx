// src/components/BotChat.tsx
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import SecurityChatbotIcon from "./ChatbotIcon"; // adjust path as needed
import defaultProfileIcon from "../../assets/default-profile.png"; // or your path


interface BotProps {
    profileImage?: string; // uploaded image from profile
}

const BotChat: React.FC<BotProps> = ({profileImage}) => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<
        { question: string; answer: string }[]
    >([]);

    const askBot = async () => {
        if (!question.trim()) return;
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/ask", {
                userQuestion: question,
                userLevel: "Beginner", // You can make this dynamic
            });

            const botAnswer = res.data.answer;

            // Update chat history
            setChatHistory([...chatHistory, { question, answer: botAnswer }]);
            setAnswer(botAnswer);
            setQuestion(""); // Clear input
        } catch (error) {
            console.error("Error asking bot:", error);
            setAnswer("Sorry, something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            askBot();
        }
    };

return (
  <div className="flex flex-col h-full">
    {/* Chat History */}
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Initial message from Nick */}
      {chatHistory.length === 0 && (
        <div className="flex items-start justify-end space-x-2">
          <div className="text-sm text-gray-600 font-semibold text-right">
            Nick (Seekurify Agent):
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="p-2 bg-blue-100 rounded-lg whitespace-pre-line text-left max-w-xs"
            >
              Hey there! 👋 I'm <b>Nick</b>, your cybersecurity advisor.<br />
              What would you like to learn or ask about today?
            </div>
            {/* Wrap the bot icon in a fixed size div */}
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
              <SecurityChatbotIcon />
            </div>
          </div>
        </div>
      )}

      {/* Existing Chat History */}
      {chatHistory.map((item, index) => (
        <div key={index}>
          {/* User Message (Left side) */}
          <div className="flex items-start space-x-3">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={profileImage || defaultProfileIcon}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
            <div>
              <div className="text-sm text-gray-600 font-semibold">You:</div>
              <div className="p-2 bg-gray-100 rounded-lg whitespace-pre-line max-w-xs">
                {item.question}
              </div>
            </div>
          </div>

          {/* Chatbot Response (Right side) */}
          <div className="flex items-start justify-end space-x-2 mt-3">
            <div
              className="p-2 bg-blue-100 rounded-lg whitespace-pre-line max-w-xs text-left"
              dangerouslySetInnerHTML={{
                __html: item.answer
                  .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
                  .replace(/\n/g, "<br />"),
              }}
            />
            {/* Bot icon wrapper */}
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
              <SecurityChatbotIcon />
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator (Right side) */}
      {loading && (
        <div className="flex items-start justify-end space-x-2 mt-3">
          <div className="p-2 bg-blue-100 rounded-lg text-gray-700 animate-pulse max-w-xs">
            Nick is typing...
          </div>
          <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
            <SecurityChatbotIcon />
          </div>
        </div>
      )}
    </div>

    {/* Input Box */}
    <div className="p-3 border-t border-gray-200">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message here..."
        className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
        rows={2}
      />
      <button
        onClick={askBot}
        className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Send
      </button>
    </div>
  </div>
);


};

export default BotChat;
