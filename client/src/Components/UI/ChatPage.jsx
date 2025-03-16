import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import poco from "../../Images/Poco.png";
import "./ChatPage.css";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// const API_KEY = "AIzaSyAe427Kds-48nrzGBgdNRRCKwqntqe1YRg";
const genAI = new GoogleGenerativeAI(API_KEY);

// console.log("Gemini API Key:", API_KEY);

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const chatHistoryRef = useRef([]);

  const systemPrompt = `You are Poco, a friendly penguin who is an expert rehabilitation assistant for humans. Your personality and expertise:

- You are a cute and friendly penguin who loves helping humans recover from injuries
- You have extensive knowledge in physical therapy, injury recovery, and rehabilitation exercises
- You provide detailed, accurate, and safe guidance for various rehabilitation needs:
  * Post-surgery recovery
  * Sports injuries
  * Physical therapy exercises
  * Proper form and technique for exercises
  * Recovery timelines and milestones
  * Pain management techniques
  * Rehabilitation equipment usage
  * Progress tracking recommendations

Response Guidelines:
- Always maintain a friendly, encouraging, and supportive tone
- Provide clear, step-by-step instructions for exercises when asked
- Include safety warnings and precautions when relevant
- Explain the benefits and purpose of each recommended exercise
- For questions outside rehabilitation, politely explain that as a rehabilitation specialist, you can only help with recovery and exercise-related topics
- Keep responses concise but informative
- Never repeat your introduction after the first message
- Focus on answering the user's specific question directly
- For exercise instructions, always provide:
  * Step-by-step instructions
  * Proper form guidance
  * Common mistakes to avoid
  * Safety precautions
  * Benefits of the exercise
- Always remind users to consult their healthcare provider before starting any new exercise routine`;

  useEffect(() => {
    if (!API_KEY) {
      setError("Please set up your Gemini API key in the .env file");
      return;
    }
    handleInitialMessage();
  }, []);

  const handleInitialMessage = async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const initialPrompt = `${systemPrompt}\n\nProvide a warm introduction as Poco the penguin rehabilitation assistant, mentioning your expertise in human injury recovery and rehabilitation. Ask how you can help with their recovery journey.`;

    try {
      setIsLoading(true);
      const result = await model.generateContent(initialPrompt);
      const response = await result.response;
      const text = await response.text(); // Await text response
      const initialMessage = { role: "assistant", content: text };
      setMessages([initialMessage]);
      chatHistoryRef.current = [initialMessage];
      setError(null);
    } catch (error) {
      console.error("Error getting initial message:", error);
      setError(
        "Unable to connect to Poco. Please check your API key and try again."
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
    if (!API_KEY) {
      setError("Please set up your Gemini API key in the .env file");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    const newUserMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    chatHistoryRef.current.push(newUserMessage);
    setIsLoading(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
      });

      // Create conversation context with chat history
      const conversationContext = chatHistoryRef.current
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");

      const prompt = `${systemPrompt}\n\nConversation history:\n${conversationContext}\n\nUser: ${userMessage}\n\nProvide a direct and helpful response to the user's question without repeating your introduction. If they ask about an exercise, provide detailed instructions and benefits.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text(); // Await text response

      const newAssistantMessage = { role: "assistant", content: text };
      setMessages((prev) => [...prev, newAssistantMessage]);
      chatHistoryRef.current.push(newAssistantMessage);
    } catch (error) {
      console.error("Error getting response:", error);
      setError(
        "Sorry, I had trouble processing your message. Please try again."
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
              {message.content}
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
