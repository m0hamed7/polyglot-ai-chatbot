import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_BUSINESS_INFO, SYSTEM_PROMPT_TEMPLATE } from './constants';
import ChatInterface from './components/ChatInterface';
import { Message } from './types';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const isWidgetMode = new URLSearchParams(window.location.search).get('mode') === 'widget';
  
  const chatRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    
    if (apiKey && apiKey !== "undefined" && !chatRef.current) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_PROMPT_TEMPLATE(INITIAL_BUSINESS_INFO.overview),
            temperature: 0.7,
          },
        });
        
        if (messages.length === 0) {
          setMessages([{
            role: 'model',
            text: `✨ **Marhaba! Welcome to Polyglot Institute.**\n\nI'm **Lano**, your dedicated Education Advisor. How can I guide you today?`,
            timestamp: new Date()
          }]);
        }
      } catch (err) {
        console.error("Failed to initialize Gemini:", err);
      }
    }
  }, []);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendMessage = async (text: string) => {
    if (cooldown > 0) return;

    if (!chatRef.current) {
        const apiKey = process.env.API_KEY;
        if (apiKey && apiKey !== "undefined") {
           try {
             const ai = new GoogleGenAI({ apiKey });
             chatRef.current = ai.chats.create({
               model: 'gemini-3-flash-preview',
               config: { systemInstruction: SYSTEM_PROMPT_TEMPLATE(INITIAL_BUSINESS_INFO.overview) },
             });
           } catch(e) { console.error(e); }
        }
        if (!chatRef.current) return;
    }

    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    let fullResponse = "";
    const botMsgPlaceholder: Message = { role: 'model', text: "", timestamp: new Date() };
    setMessages(prev => [...prev, botMsgPlaceholder]);

    try {
      const result = await chatRef.current.sendMessageStream({ message: text });
      for await (const chunk of result) {
        fullResponse += chunk.text || "";
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: fullResponse };
          return newMsgs;
        });
      }
    } catch (e: any) {
      console.error("Gemini Error:", e);
      const errorStr = (JSON.stringify(e) || "").toLowerCase() + (e.message || "").toLowerCase();
      
      let errorMessage = "I'm sorry, I encountered an error. Please reach us at +212 600 00 00 00.";
      
      if (errorStr.includes('429') || errorStr.includes('resource_exhausted')) {
        setCooldown(60); // Set 60s cooldown
        errorMessage = "⏳ **System Overloaded (Quota Reached)**\n\nGoogle's free AI tier has a limit. I need to take a quick **60-second break** to recharge.\n\nIn the meantime, feel free to call us at **+212 600 00 00 00**!";
      } else if (errorStr.includes('403')) {
        errorMessage = "🔑 **API Key Issue**: Access denied. Please ensure your API key is active in Google AI Studio.";
      }

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: errorMessage };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const renderChat = () => (
    <div className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end ${isWidgetMode ? 'w-full h-full inset-0 p-0 md:p-4' : ''}`}>
      <div className={`mb-4 w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] transition-all duration-500 origin-bottom-right shadow-2xl rounded-3xl overflow-hidden ${isOpen || isWidgetMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onReset={() => { localStorage.clear(); window.location.reload(); }}
          isTyping={isTyping} 
          onClose={() => setIsOpen(false)}
          isDisabled={cooldown > 0}
          placeholder={cooldown > 0 ? `Please wait ${cooldown}s...` : "Ask Lano anything..."}
        />
      </div>
      {!isWidgetMode && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-[#022255] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus:outline-none"
        >
          {isOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>
      )}
    </div>
  );

  if (isWidgetMode) {
    return <div className="w-screen h-screen bg-transparent overflow-hidden">{renderChat()}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-4xl mx-auto py-20 px-6 text-center flex-1 flex flex-col justify-center items-center">
        <div className="w-24 h-24 bg-[#022255] text-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black mb-8 shadow-2xl">P</div>
        <h1 className="text-6xl md:text-7xl font-black text-[#022255] mb-6 tracking-tighter">Polyglot Nador</h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium mb-12">The heart of accredited language education in Nador.</p>
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg w-full">
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Official AI Advisor</p>
           <button onClick={() => setIsOpen(true)} className="w-full bg-[#022255] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95">Chat with Lano</button>
        </div>
      </div>
      {renderChat()}
    </div>
  );
};

export default App;