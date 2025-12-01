
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Chat, GenerateContentResponse } from '@google/genai';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const session = createChatSession();
      setChatSession(session);
      setMessages([
        {
          id: 'init',
          role: 'model',
          content: "Hello! I'm Gemini 2.5 Flash. I can chat, analyze images, and help you with various tasks."
        }
      ]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip the data url prefix for the API if needed, but often we store full string for preview
        // The API wants just the base64 data usually, but we handle that in send
        const base64Data = base64String.split(',')[1];
        setAttachment({
            data: base64Data,
            mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !chatSession || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachment: attachment ? { ...attachment } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
        let resultStream;
        
        if (userMsg.attachment) {
             // For multimodal, we construct the message with parts
             // Note: The @google/genai SDK usually handles this structure in sendMessage
             resultStream = await chatSession.sendMessageStream({
                 message: [
                     { text: userMsg.content || " " }, // Ensure some text exists
                     { inlineData: { mimeType: userMsg.attachment.mimeType, data: userMsg.attachment.data } }
                 ]
             });
        } else {
             resultStream = await chatSession.sendMessageStream({ message: userMsg.content });
        }
      
      const botMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [
        ...prev, 
        { id: botMsgId, role: 'model', content: '' }
      ]);

      let fullText = '';
      
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMsgId ? { ...msg, content: fullText } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', content: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Gemini 2.5 Flash Chat</h2>
          <p className="text-xs text-slate-400">Multimodal • Text & Images</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] space-y-2`}>
                {msg.attachment && (
                    <div className={`rounded-xl overflow-hidden border border-slate-600 ${msg.role === 'user' ? 'ml-auto w-48' : 'w-64'}`}>
                        <img 
                            src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                            alt="Attachment" 
                            className="w-full h-auto object-cover"
                        />
                    </div>
                )}
                {msg.content && (
                    <div className={`rounded-2xl p-4 ${
                        msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                        }`}>
                        {msg.role === 'model' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                    </div>
                )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={16} />
             </div>
             <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-300"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        {attachment && (
            <div className="flex items-center space-x-2 mb-3 bg-slate-900/50 p-2 rounded-lg w-fit border border-slate-700">
                <div className="w-10 h-10 rounded overflow-hidden">
                    <img 
                        src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <span className="text-xs text-slate-400 truncate max-w-[150px]">Image attached</span>
                <button 
                    onClick={() => setAttachment(null)}
                    className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
                >
                    <X size={14} />
                </button>
            </div>
        )}
        <div className="flex gap-2 relative">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
            title="Attach image"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? "Ask about this image..." : "Ask me anything..."}
            className="flex-1 bg-slate-900 text-slate-100 rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 max-h-32 min-h-[56px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachment) || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
