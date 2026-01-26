import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import SecurityChatbotIcon from "./ChatbotIcon";
import defaultProfileIcon from "../../assets/default-profile.png";
import { MediaKey, mediaLibrary, MediaItem } from "../chatbot/richMediaLibrary"; // Update imports at the top

interface BotProps {
  profileImage?: string;
}

const predefinedQuestions = [
  "What is cybersecurity?",
  "Why is cybersecurity important?",
  "What are common types of cyber threats?",
  "What is social engineering?",
  "Explain phishing with an example.",
  "What is spear phishing and how is it different from phishing?",
  "What is tailgating in cybersecurity?",
  "What is ransomware and how does it work?",
  "What are malware, spyware, and trojans?",
  "How to protect my system from malware?",
  "How can I create a strong password?",
  "What are the best password management practices?",
];

// Update the Media type definition
type Media = {
  type: "image" | "table";
  src?: string;
  caption?: string;
  headers?: ReadonlyArray<string>;
  rows?: ReadonlyArray<ReadonlyArray<string>>;
};

// Or alternatively, using a more concise syntax:
// type Media = {
//   type: "image" | "table";
//   src?: string;
//   caption?: string;
//   headers?: readonly string[];
//   rows?: readonly (readonly string[])[];
// };

const BotChat: React.FC<BotProps> = ({ profileImage }) => {
  const [question, setQuestion] = useState("");
  const [positiveCount, setPositiveCount] = useState<Record<string, number>>({});
const [negativeCount, setNegativeCount] = useState<Record<string, number>>({});
const [thankYouMap, setThankYouMap] = useState<Record<string, boolean>>({});

  const [answer, setAnswer] = useState("");
  const [widgetType, setWidgetType] = useState<"linkScanner" | "quiz" | "stepByStep" | null>(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedbackMap] = useState<{ [key: string]: "up" | "down" | null }>({});
  const [savedMessages, setSavedMessages] = useState<string[]>(() => {
  const stored = localStorage.getItem("savedMessages");
  // Feedback counters
// At the top of your component


  return stored ? JSON.parse(stored) : [];
});
const [showSaved, setShowSaved] = useState(false);
  const [widgetData, setWidgetData] = useState<any>(null);
const [responseFormat, setResponseFormat] = useState<"concise" | "detailed" | "bullet">("detailed");
  const [chatHistory, setChatHistory] = useState<{
    question: string;
    answer: string;
    suggestions: string[];
    widgetType: "linkScanner" | "quiz" | "stepByStep" | null;
    widgetData: any;
    feedback: "up" | "down" | null;
    media?: Media;
    format?: "concise" | "detailed" | "bullet";
  }[]>([]);


  // 🌗 Dark Mode Stat  e 
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  // 🧠 Typing Animation State
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) setChatHistory(JSON.parse(saved));
  }, []);

  // ✅ Save chat history whenever updated
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  // ✅ Save theme preference
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // 🪄 Typing Animation Effect
  useEffect(() => {
    if (chatHistory.length === 0) return;

    const lastMsg = chatHistory[chatHistory.length - 1];
    if (!lastMsg || !lastMsg.answer) return;

    setIsTyping(true);
    const fullText = lastMsg.answer;
    setDisplayedText("");
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + fullText.charAt(index));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // speed of typing in ms

    return () => clearInterval(interval);
  }, [chatHistory]);



  const getRichMedia = (message: string): Media | null => {
  // Log the message and mediaLibrary to debug
  console.log('Checking message:', message);
  console.log('Available media keys:', Object.keys(mediaLibrary));

  const key = Object.keys(mediaLibrary).find((term) =>
    message.toLowerCase().includes(term.toLowerCase())
  );

  if (!key) {
    console.log('No matching media found');
    return null;
  }

  console.log('Found matching key:', key);
  const media = mediaLibrary[key as MediaKey];
  
  // Log the media object to verify its structure
  console.log('Media object:', media);

  if (media.type === "image") {
    return {
      type: "image",
      src: media.src,
      caption: media.caption
    };
  }

  if (media.type === "table") {
    return {
      type: "table",
      headers: media.headers as readonly string[],
      rows: media.rows as readonly (readonly string[])[]
    };
  }

  return null;
};

// 🔧 Format answers into markdown bullets when requested
const ensureBulletMarkdown = (text: string) => {
  if (!text) return text;
  // if already contains list markers like -, *, • or numbers, return as-is
  const hasListMarker = /(^|\n)[\s]*([-*•]|\d+\.)\s+/.test(text);
  if (hasListMarker) return text;
  // Split into lines by newlines or by sentence boundaries (., ?, !)
  const parts = text
    .split(/\n{1,}|\.\s+|\?\s+|!\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => `- ${p.replace(/\.$/, "")}`).join("\n");
};

  // 🧠 Ask bot function
  const askBot = async (customQuestion?: string) => {

     const finalQuestion = customQuestion || question;

  const payload = {
    userQuestion: finalQuestion,
    userLevel: "Beginner",
    format: responseFormat, // 👈 important
  };

    const userQuestion = customQuestion || question;
    if (!userQuestion.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/ask", payload);

      console.log('Bot API response:', res.data);

      const {
        answer: botAnswer,
        suggestions = [],
        widgetType = null,
        widgetData = {},
        feedback = null,
      } = res.data;

      const media = getRichMedia(botAnswer);
      console.log('Generated media object:', media); // Debug log

      setChatHistory((prev) => [
        ...prev,
        {
          question: userQuestion,
          answer: botAnswer,
          suggestions,
          widgetType,
          widgetData,
          feedback,
          media: media || undefined, // Explicitly handle null case
          format: responseFormat,
        }
      ]);

      setQuestion("");
      setAnswer(botAnswer);
    } catch (error) {
      console.error("Error asking bot:", error);
      setAnswer("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Step-by-step Widget
  const StepByStepWidget = ({ steps }: { steps: string[] }) => {
    const [currentStep, setCurrentStep] = useState(0);
    if (!steps || steps.length === 0) return null;

    return (
      <div className="p-3 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="font-semibold mb-2">🧭 Step {currentStep + 1} of {steps.length}</div>
        <p className="text-sm mb-3">{steps[currentStep]}</p>
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 0))}
            disabled={currentStep === 0}
            className={`px-3 py-1 rounded ${currentStep === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
              }`}
          >
            ◀ Previous
          </button>
          <button
            onClick={() => setCurrentStep((p) => Math.min(p + 1, steps.length - 1))}
            disabled={currentStep === steps.length - 1}
            className={`px-3 py-1 rounded ${currentStep === steps.length - 1
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Next ▶
          </button>
        </div>
      </div>
    );
  };

  const LinkScannerWidget = () => {
    const scanUrl = () => {
      if (url.includes("phishing")) setStatus("⚠️ Suspicious link detected!");
      else setStatus("✅ Safe link detected.");
    };

    return (
      <div className="p-3 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <input
          type="text"
          placeholder="Enter URL to scan..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border rounded mb-2 dark:bg-gray-700"
        />
        <button
          onClick={scanUrl}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Scan
        </button>
        {status && <div className="mt-2 font-semibold">{status}</div>}
      </div>
    );
  };

  const QuizWidget = ({ question, options }: { question: string; options: string[] }) => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <div className="p-3 border rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="font-semibold mb-2">{question}</div>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(opt)}
              className={`px-3 py-1 rounded transition ${selected === opt
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-blue-200"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {selected && <div className="mt-2 text-sm">You selected: {selected}</div>}
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askBot();
    }
  };

const handleFeedback = async (answer: string, type: "up" | "down") => {
  // Update which feedback the user clicked
  setFeedbackMap((prev) => {
    const current = prev[answer];
    const updated = {
      ...prev,
      [answer]: current === type ? null : type,
    };
    return updated;
  });

  // Compute new counters
  let newPositiveCount = positiveCount[answer] || 0;
  let newNegativeCount = negativeCount[answer] || 0;

  if (type === "up") {
    newPositiveCount += 1;
    setPositiveCount((prev) => ({
      ...prev,
      [answer]: newPositiveCount,
    }));
  } else if (type === "down") {
    newNegativeCount += 1;
    setNegativeCount((prev) => ({
      ...prev,
      [answer]: newNegativeCount,
    }));
  }

  // Show “Thank you” message
  setThankYouMap((prev) => ({ ...prev, [answer]: true }));
  setTimeout(() => {
    setThankYouMap((prev) => ({ ...prev, [answer]: false }));
  }, 3000);

  // 🗄️ Send feedback + counters to backend
  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        feedback: type,
        positiveCount: newPositiveCount,
        negativeCount: newNegativeCount,
        thankYou: true,
      }),
    });
  } catch (err) {
    console.error("Error saving feedback:", err);
  }
};







  const steps = useMemo(() => {
    const lastStepItem = [...chatHistory].reverse().find(i => i.widgetType === "stepByStep");
    return lastStepItem?.widgetData?.steps || [
      "Identify the suspicious email.",
      "Do not click on any links.",
      "Report it to your IT department.",
    ];
  }, [chatHistory]);


  const handleSave = (message: string) => {
  setSavedMessages((prev) => {
    const updated = prev.includes(message)
      ? prev.filter((m) => m !== message)
      : [...prev, message];
    localStorage.setItem("savedMessages", JSON.stringify(updated));
    return updated;
  });
}


return (
  <div
    className={`flex flex-col h-full transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
    }`}
  >
    {/* 🌙 Light/Dark Mode + Saved Toggle */}
    <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="px-3 py-1 text-sm font-medium rounded transition hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {/* ⭐ View Saved Responses */}
      <button
        onClick={() => setShowSaved(!showSaved)}
        className={`px-3 py-1 text-sm font-medium rounded transition ${
          darkMode
            ? "bg-gray-700 hover:bg-blue-700 text-gray-100"
            : "bg-gray-200 hover:bg-blue-200 text-gray-800"
        }`}
      >
        {showSaved ? "📁 Hide Saved" : "⭐ View Saved"}
      </button>
    </div>

    {/* 📚 Saved Responses Section */}
    {showSaved && (
      <div
        className={`p-3 border-b max-h-[250px] overflow-y-auto ${
          darkMode
            ? "border-gray-700 bg-gray-800 text-gray-100"
            : "border-gray-200 bg-gray-50 text-gray-800"
        }`}
      >
        <h2 className="font-semibold text-lg mb-2">⭐ Saved Responses</h2>
        {savedMessages.length > 0 ? (
          <ul className="space-y-2">
            {savedMessages.map((msg, i) => (
              <li
                key={i}
                className={`p-3 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <ReactMarkdown
                  components={{
                    ul: ({ children, ...props }) => (
                      <ul {...props} className="list-none p-0 m-0 space-y-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children, ...props }) => (
                      <li {...props} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">•</span>
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                  }}
                >
                  {msg}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-gray-500">
            No saved responses yet.
          </p>
        )}
      </div>
    )}

    {/* 🧾 Response Format Selector */}
    <div className="flex gap-2 mb-2 p-3">
      {[
        { id: "concise" as const, label: "⚡ Concise" },
        { id: "detailed" as const, label: "📖 Detailed" },
        { id: "bullet" as const, label: "📌 Bullet Points" },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => setResponseFormat(opt.id)}
          className={`px-3 py-1 text-sm rounded-full transition ${
            responseFormat === opt.id
              ? "bg-blue-600 text-white"
              : darkMode
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>

    {/* 💬 Chat Area */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Initial Nick Message */}
      {chatHistory.length === 0 && (
        <div className="flex justify-start mt-2">
          <div className="flex flex-col items-start space-y-1 max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-2xl">
            <div className="text-sm font-semibold text-gray-600 dark:text-white">
              Nick (Seekurify Agent)
            </div>
            <div className="flex items-end space-x-2">
              <div className="w-10 h-10 overflow-hidden rounded-full">
                <SecurityChatbotIcon />
              </div>
              <div
                className={`p-3 rounded-lg ${
                  darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100"
                }`}
              >
                Hey there! 👋 I'm <b>Nick</b>, your cybersecurity advisor.
                <br />
                What would you like to learn or ask about today?
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 Chat History */}
      {chatHistory.map((item, index) => (
        <div key={index} className="space-y-2">
          {/* 👤 User Message */}
          <div className="flex items-start justify-end space-x-2 ml-auto">
            <div>
              <div className="text-sm text-right text-gray-600 dark:text-white font-semibold">
                You
              </div>
              <div
                className={`p-3 rounded-lg ${
                  darkMode ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                {item.question}
              </div>
            </div>
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={profileImage || defaultProfileIcon}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
          </div>

          {/* 🤖 Bot Message */}
          <div className="flex items-start space-x-2">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Nick (Seekurify Agent)
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-10 h-10 overflow-hidden rounded-full">
                  <SecurityChatbotIcon />
                </div>
                <div
                  className={`relative p-3 rounded-lg prose max-w-none ${
                    darkMode
                      ? "bg-blue-900 text-blue-100 prose-invert"
                      : "bg-blue-100"
                  }`}
                >
                  {/* Answer Text */}
                  <div className="pr-8">
                    {index === chatHistory.length - 1 && isTyping ? (
                      <p>
                        {displayedText}
                        <span className="animate-pulse ml-1">▮</span>
                      </p>
                    ) : (
                      <>
                        <ReactMarkdown
                          components={{
                            ul: ({ children, ...props }) => (
                              <ul {...props} className="list-none p-0 m-0 space-y-2">
                                {children}
                              </ul>
                            ),
                            li: ({ children, ...props }) => (
                              <li {...props} className="flex items-start">
                                <span className="text-blue-600 mr-2 mt-1">•</span>
                                <span className="flex-1">{children}</span>
                              </li>
                            ),
                          }}
                        >
                          {item.answer}
                        </ReactMarkdown>

                        {/* 🖼️ Rich Media Rendering */}
                        {item.media && (
                          <div className="mt-3">
                            {/* Image rendering */}
                            {item.media?.type === "image" && item.media.src && (
                              <div className="flex flex-col items-center">
                                <img
                                  src={item.media.src}
                                  alt={item.media.caption || ""}
                                  className="rounded-xl shadow-md max-w-xs sm:max-w-sm md:max-w-md mb-2"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />

                                {item.media.caption && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                                    {item.media.caption}
                                  </p>
                                )}

                                {/* 🌟 View & Download Buttons */}
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => window.open(item.media?.src, "_blank")}
                                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                                  >
                                    View
                                  </button>
                                  <a
                                    href={item.media.src}
                                    download={item.media.caption || "image"}
                                    className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Table rendering */}
                            {item.media?.type === "table" &&
                              item.media.headers &&
                              item.media.rows && (
                                <table className="mt-3 border border-gray-300 rounded-lg text-sm">
                                  <thead className="bg-indigo-100 dark:bg-blue-800">
                                    <tr>
                                      {item.media.headers.map((h, i) => (
                                        <th key={i} className="px-4 py-2 border">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.media.rows.map((row, rIdx) => (
                                      <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="px-4 py-2 border">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ⭐ Save Button */}
                  <button
                    onClick={() => handleSave(item.answer)}
                    className={`absolute top-2 right-2 text-2xl transition ${
                      savedMessages.includes(item.answer)
                        ? "text-yellow-400"
                        : "text-gray-400 hover:text-yellow-400"
                    }`}
                  >
                    ★
                  </button>

                  {/* 👍👎 Feedback */}
                  <div className="flex items-center gap-3 mt-3 text-lg">
                    <button
                      onClick={() => handleFeedback(item.answer, "up")}
                      className={`transition-transform hover:scale-110 ${
                        item.feedback === "up"
                          ? "text-green-400"
                          : "text-gray-400 hover:text-green-400"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleFeedback(item.answer, "down")}
                      className={`transition-transform hover:scale-110 ${
                        item.feedback === "down"
                          ? "text-red-400"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                    >
                      👎
                    </button>
                  </div>

                  {/* ⚙️ Dynamic Widgets */}
                  {item.widgetType === "linkScanner" && <LinkScannerWidget />}
                  {item.widgetType === "quiz" && (
                    <QuizWidget
                      question={
                        item.widgetData?.question || "Which one looks suspicious?"
                      }
                      options={
                        item.widgetData?.options || [
                          "support@paypal.com",
                          "help@paypa1.com",
                          "security@paypal.com",
                        ]
                      }
                    />
                  )}
                  {item.widgetType === "stepByStep" && (
                    <StepByStepWidget steps={steps} />
                  )}

                  {/* 💡 Suggestions */}
                  {item.suggestions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => askBot(s)}
                          className={`px-3 py-1 text-sm rounded-full transition ${
                            darkMode
                              ? "bg-gray-700 hover:bg-blue-700 text-gray-100"
                              : "bg-gray-200 hover:bg-blue-200 text-gray-800"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ⏳ Typing Indicator */}
      {loading && (
        <div className="flex items-start space-x-2 mt-3">
          <div className="w-10 h-10 overflow-hidden rounded-full">
            <SecurityChatbotIcon />
          </div>
          <div
            className={`p-3 rounded-lg flex items-center space-x-1 ${
              darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100"
            }`}
          >
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>

    {/* 💬 Predefined Questions */}
    <div
      className={`flex flex-wrap gap-2 p-3 border-t ${
        darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
      }`}
    >
      {predefinedQuestions.map((q, i) => (
        <button
          key={i}
          onClick={() => askBot(q)}
          className={`px-3 py-1 text-sm rounded-full transition ${
            darkMode
              ? "bg-gray-700 hover:bg-blue-700 text-gray-100"
              : "bg-gray-200 hover:bg-blue-200 text-gray-800"
          }`}
        >
          {q}
        </button>
      ))}
    </div>

    {/* ✍️ Input Section */}
    <div
      className={`p-3 border-t ${
        darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className={`flex-1 p-2 border rounded focus:outline-none focus:ring focus:border-blue-400 resize-none text-sm sm:text-base ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-gray-100"
              : "bg-white border-gray-300 text-gray-900"
          }`}
          rows={2}
        />
        <button
          onClick={() => askBot()}
          disabled={loading || question.trim().length === 0}
          className={`px-4 py-2 rounded transition w-full sm:w-auto ${
            loading || question.trim().length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  </div>
);

};

export default BotChat;
