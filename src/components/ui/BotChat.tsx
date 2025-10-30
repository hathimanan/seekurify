// src/components/BotChat.tsx
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import SecurityChatbotIcon from "./ChatbotIcon"; // adjust path as needed
import defaultProfileIcon from "../../assets/default-profile.png"; // or your path


interface BotProps {
    profileImage?: string; // uploaded image from profile
}

const BotChat: React.FC<BotProps> = ({ profileImage }) => {
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
            setQuestion(""); // Clear input

            setChatHistory([...chatHistory, { question, answer: botAnswer }]);
            setAnswer(botAnswer);
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
        <div className="flex justify-end mt-2">
          <div className="flex flex-col items-end space-y-1 max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl">
            {/* Nick's name */}
            <div className="text-sm text-gray-600 font-semibold text-right">
              Nick (Seekurify Agent)
            </div>

            {/* Message bubble + icon */}
            <div className="flex items-end space-x-2">
              <div
                className="p-3 bg-blue-100 rounded-lg text-left break-words"
              >
                Hey there! 👋 I'm <b>Nick</b>, your cybersecurity advisor.<br />
                What would you like to learn or ask about today?
              </div>
              <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
                <SecurityChatbotIcon />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Chat History */}
      {chatHistory.map((item, index) => (
        <div key={index} className="space-y-2">
          {/* User Message */}
          <div className="flex items-start space-x-3 max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={profileImage || defaultProfileIcon}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300 flex-shrink-0"
            />
            <div>
              <div className="text-sm text-gray-600 font-semibold">You:</div>
              <div className="p-3 bg-gray-100 rounded-lg whitespace-pre-line break-words">
                {item.question}
              </div>
            </div>
          </div>

          {/* Chatbot Response */}
          <div className="flex items-start justify-end space-x-2 max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl ml-auto">
            <div
              className="p-3 bg-blue-100 rounded-lg whitespace-pre-line text-left break-words"
              dangerouslySetInnerHTML={{
                __html: item.answer
                  .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
                  .replace(/\n/g, "<br />"),
              }}
            />
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
              <SecurityChatbotIcon />
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-start justify-end space-x-2 mt-3">
          <div className="p-3 bg-blue-100 rounded-lg text-gray-700 animate-pulse max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl">
            Nick is typing...
          </div>
          <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
            <SecurityChatbotIcon />
          </div>
        </div>
      )}
    </div>

    {/* Input Box */}
    <div className="p-3 border-t border-gray-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className="flex-1 p-2 border rounded focus:outline-none focus:ring focus:border-blue-400 resize-none text-sm sm:text-base"
          rows={2}
        />
        <button
          onClick={askBot}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full sm:w-auto"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);



};

            export default BotChat;
