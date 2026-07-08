/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import poco from "../../Images/Poco.png";
import "./ChatPage.css";
import ReactMarkdown from 'react-markdown';


function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const chatHistoryRef = useRef([]);

  // System prompt has been securely moved to the backend


  useEffect(() => {
    handleInitialMessage();
  }, []);

  const handleInitialMessage = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "", history: [], is_initial: true })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }
      
      const text = data.response;
      const initialMessage = { role: "assistant", content: text };
      setMessages([initialMessage]);
      chatHistoryRef.current = [initialMessage];
      setError(null);
    } catch (error) {
      console.error("Error getting initial message:", error);
      setError(
        "Unable to connect to the backend server. Make sure the Python server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };



  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    const newUserMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    
    // We append to history ref but we'll send the previous history to the backend
    const currentHistory = [...chatHistoryRef.current];
    chatHistoryRef.current.push(newUserMessage);
    
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, history: currentHistory, is_initial: false })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }
      
      const text = data.response;

      const newAssistantMessage = { role: "assistant", content: text };
      setMessages((prev) => [...prev, newAssistantMessage]);
      chatHistoryRef.current.push(newAssistantMessage);
    } catch (error) {
      console.error("Error getting response:", error);
      setError(
        "Sorry, I had trouble processing your message. Make sure the backend server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {/* Header */}
      <div className="chat-header bg-white shadow-md p-4 flex items-center">
        <button
          onClick={() => navigate("/")}
          className="mr-4 hover:bg-blue-50 p-2 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <img src={poco} alt="Poco" className="w-10 h-10 rounded-full mr-3" />
        <h1 className="text-xl font-semibold">Chat with Poco</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 flex items-center">
          <AlertCircle className="text-red-400 mr-2" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 rounded-lg p-3">
              Poco is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container bg-white p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Poco about rehabilitation..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!error}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !!error}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
