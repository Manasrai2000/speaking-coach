"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mic, Loader2, Volume2, Clipboard, StopCircle, ArrowUp, VolumeX } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "coach";
  text: string;
  isError?: boolean;
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputTextRef = useRef(""); // To access latest state in speech callbacks

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop when the user stops talking
        recognition.interimResults = true;
        recognition.lang = "hi-IN";

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInputText(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          // Gracefully handle "no-speech" error which occurs when nothing is said within timeout
          if (event.error !== "no-speech") {
            console.error("Speech recognition error", event.error);
          }
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        setInputText("");
        recognitionRef.current.start();
      }
    }
  };

  const handleTranslate = async (textToTranslate: string) => {
    const text = textToTranslate.trim();
    if (!text) return;

    if (isLoading) return;
    
    // Stop any ongoing speech and recording
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText(""); // Clear input box immediately
    setIsLoading(true);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      const data = await response.json();
      
      const newCoachMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        text: response.ok ? data.professional : (data.error || "Something went wrong. Please try again."),
        isError: !response.ok,
      };

      setMessages((prev) => [...prev, newCoachMsg]);

      // Auto-play voice for successful translations
      if (!newCoachMsg.isError) {
        playVoice(newCoachMsg.id, newCoachMsg.text);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        text: "Network error. Please try again.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const playVoice = (id: string, text: string) => {
    if (typeof window === "undefined") return;
    
    // Stop current speech if any
    window.speechSynthesis.cancel();

    if (speakingMessageId === id) {
      // Toggle off if clicking the already speaking message
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(id);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 sm:p-4 overflow-hidden">
      <Card className="w-full max-w-4xl h-full sm:h-[90vh] shadow-xl border-zinc-200 dark:border-zinc-800 flex flex-col sm:rounded-3xl overflow-hidden rounded-none border-x-0 sm:border-x">
        
        {/* Header */}
        <CardHeader className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 py-4 px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Hindi to English Coach
              </CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live Translation Session</p>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-full border border-red-100 dark:border-red-900">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-widest hidden sm:inline-block">Listening</span>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Chat window */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/50 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          
          {messages.length === 0 && !isLoading && !inputText && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="p-4 bg-white dark:bg-zinc-900/80 rounded-full shadow-sm">
                <Mic className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm">Speak or type in Hindi to begin</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <span className="text-[11px] font-medium text-zinc-400 mb-1 px-1 uppercase tracking-wider">
                {msg.role === "user" ? "You (Hindi)" : "Coach (English)"}
              </span>
              <div
                className={`relative px-4 py-3 rounded-2xl max-w-[90%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed ${
                  msg.role === "user"
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tr-sm"
                    : msg.isError 
                      ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-tl-sm"
                      : "bg-blue-600 text-white min-w-[200px] shadow-sm rounded-tl-sm"
                }`}
              >
                {msg.text}
                
                {msg.role === "coach" && !msg.isError && (
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-blue-500/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => playVoice(msg.id, msg.text)} 
                      className={`h-8 px-2 flex-1 justify-center text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-colors ${speakingMessageId === msg.id ? 'bg-blue-500 text-white' : ''}`}
                    >
                      {speakingMessageId === msg.id ? <VolumeX className="h-4 w-4 mr-1.5" /> : <Volume2 className="h-4 w-4 mr-1.5" />}
                      <span className="text-sm font-medium">{speakingMessageId === msg.id ? 'Stop' : 'Play'}</span>
                    </Button>
                    <div className="w-px h-4 bg-blue-500/50 mx-1"></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(msg.text)} 
                      className="h-8 w-8 px-0 flex-shrink-0 text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                      title="Copy"
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* User's Interim Input Box Wrapper */}
          {inputText && !isLoading && (
             <div className="flex flex-col items-end">
             <span className="text-[11px] font-medium text-zinc-400 mb-1 px-1 uppercase tracking-wider animate-pulse">
               Typing...
             </span>
             <div className="px-4 py-3 rounded-2xl max-w-[90%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tr-sm opacity-70">
               {inputText}
             </div>
           </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
               <span className="text-[11px] font-medium text-zinc-400 mb-1 px-1 uppercase tracking-wider">
                Coach (English)
              </span>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                <span className="text-sm font-medium text-zinc-500 animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-px shrink-0" />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] mt-auto pb-safe">
          <div className="relative flex items-center max-w-4xl mx-auto gap-2">
            
            <div className="relative flex-1">
              <Input
                placeholder="Type or speak in Hindi..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTranslate(inputText);
                }}
                disabled={isLoading}
                className="pr-12 h-12 rounded-full border-zinc-300 dark:border-zinc-700 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-500 text-base shadow-sm px-5"
              />
              <Button
                size="icon"
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                onClick={toggleRecording}
                disabled={isLoading || !recognitionRef.current}
                title={!recognitionRef.current ? "Speech recognition not supported" : "Toggle voice input"}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full transition-all ${isRecording ? 'animate-pulse hover:bg-red-600' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}`}
              >
                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </div>

            <Button 
              size="icon"
              className="h-12 w-12 rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
              onClick={() => handleTranslate(inputText)}
              disabled={isLoading || !inputText.trim()}
            >
               <ArrowUp className="h-6 w-6" />
            </Button>

          </div>
        </div>

      </Card>
      
      <style jsx global>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </main>
  );
}
