import React, { useState, useEffect, useRef } from 'react';
import { Plus, Mic, AudioLines, ChevronDown, ThumbsUp, ThumbsDown, RotateCcw, Copy, MoreVertical, ArrowDown } from 'lucide-react';
import { sendMessage } from '../api/api';

const Chatbot = ({ context = "", onCommand }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasCleaned, setHasCleaned] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages(prev => [...prev, { role: 'user', content: `Uploaded file: ${file.name}` }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    setShowScrollBtn(scrollHeight - scrollTop > clientHeight + 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (manualText) => {
    const text = typeof manualText === 'string' ? manualText : input;
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    if (typeof manualText !== 'string') setInput('');
    setIsTyping(true);

    try {
      if (onCommand && (text.toLowerCase().includes('clean') || text.toLowerCase().includes('remove') || text.toLowerCase().includes('fill') || text.toLowerCase().includes('trim'))) {
        setHasCleaned(true);
        await onCommand(text);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I have applied your manual cleaning request. You can download the updated CSV below.',
          isCleaningResponse: true
        }]);
      } else {
        const response = await sendMessage(text, context);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your connection.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col min-h-[500px] bg-transparent relative">
      <div 
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 space-y-6 p-8 pb-40 overflow-y-auto scrollbar-hide max-h-[75vh]"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`flex items-end space-x-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              {m.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0 mb-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <AudioLines className="w-5 h-5" />
                  </div>
                </div>
              )}
              
              <div className={`relative px-6 py-3 shadow-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-[1.5rem] rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-[1.5rem] rounded-tl-none'
              }`}>
                <div className={`${m.role === 'assistant' ? 'text-base' : 'text-sm'} font-medium leading-relaxed tracking-tight group`}>
                  {m.content.split('\n').map((line, idx) => {
                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                    const content = isBullet ? line.trim().substring(2) : line;
                    const boldedLine = content.replace(/\*\*(.*?)\*\*/g, `<span class="${m.role === 'user' ? 'text-indigo-100' : 'text-indigo-600'} font-black">$1</span>`);
                    
                    if (isBullet) {
                      return (
                        <div key={idx} className="flex items-start space-x-3 mb-2 ml-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${m.role === 'user' ? 'bg-indigo-200' : 'bg-indigo-500'}`} />
                          <p className="flex-1" dangerouslySetInnerHTML={{ __html: boldedLine }} />
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: boldedLine }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center space-x-2 ml-14">
            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Button */}
      {showScrollBtn && (
        <button 
          onClick={scrollToBottom}
          className="fixed bottom-48 left-1/2 -translate-x-1/2 p-2 bg-white text-[#4f46e5] rounded-full hover:scale-110 transition-all shadow-xl z-50"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Minimalist Single-Row Input Area */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-full p-2 px-6 shadow-2xl focus-within:bg-white transition-all duration-300 flex items-center space-x-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-1 flex items-center space-x-4">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            <button type="button" onClick={handlePlusClick} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
              <Plus className="w-6 h-6" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Optima AI"
              className="flex-1 bg-transparent text-slate-900 text-lg font-medium focus:outline-none placeholder-slate-400 py-3 tracking-tight"
            />

            <button 
              type="submit" 
              disabled={!input.trim()}
              className={`p-2.5 rounded-full transition-all shadow-md shrink-0 ${input.trim() ? 'bg-[#4f46e5] text-white hover:bg-black scale-100' : 'bg-slate-100 text-slate-400 scale-95 opacity-50 cursor-not-allowed'}`}
            >
              <ArrowDown className="w-6 h-6 -rotate-90" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
