
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Paperclip, X, Mic, Square, Terminal, Feather, BarChart, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, PERSONAS, Persona } from '../types';
import { Chat, GenerateContentResponse } from '@google/genai';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, type: 'image' | 'audio'} | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat
  useEffect(() => {
    initChat(currentPersona);
  }, [currentPersona]);

  const initChat = (persona: Persona) => {
    try {
      const session = createChatSession(persona.systemInstruction);
      setChatSession(session);
      setMessages([
        {
          id: 'init',
          role: 'model',
          content: `Hello! I'm Gemini 2.5 Flash, acting as your ${persona.name}. How can I help you today?`
        }
      ]);
      setAttachment(null);
      setInput('');
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setAttachment({
            data: base64Data,
            mimeType: file.type,
            type: file.type.startsWith('audio') ? 'audio' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          setAttachment({
            data: base64Data,
            mimeType: 'audio/webm',
            type: 'audio'
          });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
        
        const parts: any[] = [];
        if (userMsg.content) {
            parts.push({ text: userMsg.content });
        }
        if (userMsg.attachment) {
            parts.push({ 
                inlineData: { 
                    mimeType: userMsg.attachment.mimeType, 
                    data: userMsg.attachment.data 
                } 
            });
        }
        
        // If only attachment, we must provide at least an empty text or just the attachment part
        if (parts.length === 0) {
             parts.push({ text: " " });
        }

        resultStream = await chatSession.sendMessageStream({ message: parts });
      
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

  // Helper to render icon for persona
  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal': return <Terminal size={18} />;
      case 'Feather': return <Feather size={18} />;
      case 'BarChart': return <BarChart size={18} />;
      default: return <Bot size={18} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">FL Chatbot</h2>
            <p className="text-xs text-slate-400">Gemini 2.5 Flash • Multimodal</p>
          </div>
        </div>

        {/* Persona Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors border border-slate-600"
          >
            {getPersonaIcon(currentPersona.icon)}
            <span className="text-sm font-medium">{currentPersona.name}</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>
          
          {isPersonaMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
              {PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => {
                    setCurrentPersona(persona);
                    setIsPersonaMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center space-x-3 transition-colors ${
                    currentPersona.id === persona.id ? 'bg-indigo-900/30 text-indigo-300' : 'text-slate-300'
                  }`}
                >
                  <div className="opacity-80">{getPersonaIcon(persona.icon)}</div>
                  <div>
                    <div className="text-sm font-medium">{persona.name}</div>
                    <div className="text-xs opacity-60">{persona.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
                    <div className={`rounded-xl overflow-hidden border border-slate-600 ${msg.role === 'user' ? 'ml-auto w-fit' : 'w-fit'}`}>
                        {msg.attachment.type === 'image' ? (
                             <img 
                                src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                                alt="Attachment" 
                                className="max-w-[200px] h-auto object-cover"
                            />
                        ) : (
                            <div className="flex items-center space-x-2 bg-slate-800 p-3 min-w-[150px]">
                                <Mic size={20} className="text-pink-400" />
                                <span className="text-xs text-slate-300">Voice Audio Message</span>
                            </div>
                        )}
                       
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
                <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-slate-800">
                   {attachment.type === 'image' ? (
                       <img 
                            src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                   ) : (
                       <Mic size={20} className="text-pink-400" />
                   )}
                </div>
                <span className="text-xs text-slate-400 truncate max-w-[150px]">
                    {attachment.type === 'image' ? 'Image attached' : 'Audio recorded'}
                </span>
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
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-all ${
                isRecording 
                ? 'bg-red-500/20 text-red-500 animate-pulse-ring' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isRecording ? "Stop recording" : "Record voice"}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording audio..." : attachment ? "Add a message..." : "Type or speak..."}
            className="flex-1 bg-slate-900 text-slate-100 rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 max-h-32 min-h-[56px]"
            rows={1}
            disabled={isLoading || isRecording}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachment) || isLoading || isRecording}
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