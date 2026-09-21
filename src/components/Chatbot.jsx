import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hi! I am your Punjab Portal AI assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://compalint-portal.onrender.com/';
      const response = await axios.post(`${apiUrl.replace(/\/$/, '')}/api/chat/ask`, {
        message,
        sessionId
      });

      if (response.data.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 mb-4"
          >
            {/* Header */}
            <div className="bg-gov-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Portal Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider">AI Powered</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.length === 1 && (
                <div className="flex flex-col gap-2 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quick Questions</p>
                  <button
                    onClick={() => setMessage("I can't login / How to get admission?")}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:border-gov-primary hover:text-gov-primary transition-all text-left shadow-sm"
                  >
                    🔐 I can't login / Admission process
                  </button>
                  <button
                    onClick={() => setMessage("How do I create a complaint?")}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:border-gov-primary hover:text-gov-primary transition-all text-left shadow-sm"
                  >
                    📝 How do I create a complaint?
                  </button>
                  <button
                    onClick={() => setMessage("What courses do you offer?")}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:border-gov-primary hover:text-gov-primary transition-all text-left shadow-sm"
                  >
                    🎓 What courses do you offer?
                  </button>
                  <button
                    onClick={() => setMessage("How do I pay my challan?")}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:border-gov-primary hover:text-gov-primary transition-all text-left shadow-sm"
                  >
                    💳 How do I pay my challan?
                  </button>
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${chat.role === 'user'
                      ? 'bg-gov-primary text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                    {chat.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary/20 border-transparent focus:border-gov-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gov-primary hover:bg-gov-primary hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gov-primary"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button or Minimized Bar */}
      {isMinimized && isOpen ? (
        <motion.div
          layoutId="chat-trigger"
          onClick={() => setIsMinimized(false)}
          className="bg-gov-primary text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
        >
          <Bot size={20} />
          <span className="text-sm font-bold">Resume AI Chat</span>
          <Maximize2 size={16} className="ml-2 opacity-60" />
        </motion.div>
      ) : !isOpen && (
        <motion.button
          layoutId="chat-trigger"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-gov-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-gov-dark transition-colors relative group"
        >
          <MessageSquare size={30} />
          <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Need help? Ask AI
          </span>
        </motion.button>
      )}
    </div>
  );
};

export default Chatbot;
