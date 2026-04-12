'use client';

import { useState, useEffect, useRef } from 'react';
import { Nunito, Bubblegum_Sans } from 'next/font/google';
import Image from 'next/image';
import ParrotMascot from '@/components/ParrotMascot';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700', '900'] });
const bubblegum = Bubblegum_Sans({ subsets: ['latin'], weight: ['400'] });

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function Home() {
  const [sourceLang, setSourceLang] = useState('hi');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [modelProgress, setModelProgress] = useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState({});
  const [deviceInfo, setDeviceInfo] = useState('CPU');
  const [latency, setLatency] = useState(null);
  
  const workerRef = useRef(null);
  const recognitionRef = useRef(null);

  const translateText = (text, source, target) => {
    if (!text.trim()) return;
    setTranslatedText('');
    setIsTranslating(true);
    workerRef.current?.postMessage({ text, sourceLang: source, targetLang: target });
  };

  const speak = (text, lang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Prevent overlapping
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'hi-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.2;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Setup Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/translatorWorker.js', { type: 'module' });

    workerRef.current.postMessage({ action: 'warmup', sourceLang, targetLang });

    workerRef.current.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'download_progress') {
        const fileName = msg.file || 'Preparing...';
        setDownloadingFiles(prev => {
          const newState = { ...prev };
          if (msg.status === 'done') {
            delete newState[fileName];
          } else {
            const now = Date.now();
            const existing = prev[fileName] || { startTime: now };
            const elapsed = (now - existing.startTime) / 1000;
            const speed = elapsed > 0 ? (msg.loaded || 0) / elapsed : 0;

            newState[fileName] = { 
              progress: msg.progress || 0, 
              loaded: msg.loaded || 0,
              total: msg.total || 0,
              startTime: existing.startTime,
              speed: speed,
              status: msg.status || 'Downloading' 
            };
          }
          return newState;
        });
        return;
      }

      switch (msg.status) {
        case 'hardware_info':
          setDeviceInfo(msg.device.toUpperCase());
          break;
        case 'init':
          setIsTranslating(true);
          setModelProgress('Optimizing Parrot... 🦜✨');
          break;
        case 'progress':
          setModelProgress(`Learning words... ${Math.round(msg.progress)}% ✨`);
          break;
        case 'translating':
          setModelProgress('Thinking... 🧠');
          break;
        case 'complete':
          setIsTranslating(false);
          setModelProgress(null);
          setLatency(msg.latency);
          const resultText = msg.output[0]?.translation_text || '';
          setTranslatedText(resultText);
          
          if (resultText) {
            speak(resultText, targetLang);
          }
          break;
      }
    });

    return () => workerRef.current?.terminate();
  }, [sourceLang, targetLang]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = sourceLang === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        translateText(transcript, sourceLang, targetLang);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      
      recognitionRef.current = recognition;
    }
  }, [sourceLang, targetLang]);

  const toggleRecording = () => {
    if (isRecording) recognitionRef.current?.stop();
    else {
      setSourceText('');
      setTranslatedText('');
      recognitionRef.current?.start();
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText('');
  };

  return (
    <main className={`immersive-container ${nunito.className}`}>
      {/* Background clouds */}
      <div className="cloud cloud-1">☁️</div>
      <div className="cloud cloud-2">☁️</div>
      <div className="cloud cloud-3">☁️</div>

      {/* Header */}
      <header className="app-header">
        <h1 className={`app-title ${bubblegum.className}`}>Talky Parrot</h1>
        <div className="status-row">
          <span className={`status-badge ${deviceInfo === 'WEBGPU' ? 'gpu' : 'cpu'}`}>
            {deviceInfo} MODE
          </span>
          {latency && <span className="status-badge latency">{latency}ms</span>}
        </div>
      </header>

      {/* Download Monitor */}
      {Object.keys(downloadingFiles).length > 0 && (
        <div className="download-toast-container">
          <div className="toast-header">
            <div className="toast-icon">🦜</div>
            <div className="toast-info">
              <h3>Parrot is Prep-ping!</h3>
              <p>Downloading {Object.keys(downloadingFiles).length} files</p>
            </div>
          </div>
          <div className="toast-list">
            {Object.entries(downloadingFiles).map(([file, info]) => {
              return (
                <div key={file} className="toast-item">
                  <div className="toast-item-meta">
                    <span className="toast-file-name">{file}</span>
                    <span className="toast-percentage">{Math.round(info.progress)}%</span>
                  </div>
                  <div className="toast-metrics">
                    <span className="metric-size">{formatBytes(info.loaded)} / {formatBytes(info.total)}</span>
                    <span className="metric-speed">⚡ {formatBytes(info.speed)}/s</span>
                  </div>
                  <div className="toast-progress-track">
                    <div 
                      className="toast-progress-fill" 
                      style={{ width: `${info.progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="toast-footer">
            <span>✨ One-time setup! Parrot will remember everything for next time.</span>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="dashboard">
        {/* Left: Input Side */}
        <section className="dashboard-wing input-wing">
          <div className="wing-header">
            <span className="wing-label">I&apos;m Speaking</span>
            <select className="pill-select" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="input-container">
            <textarea 
              className="giant-text-area" 
              placeholder="Start talking or type here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <button className={`toy-btn mic-btn ${isRecording ? 'active' : ''}`} onClick={toggleRecording}>
              {isRecording ? '🎧 Listening...' : '🎤 Press to Talk'}
            </button>
          </div>
        </section>

        {/* Center: The Character */}
        <div className="character-zone">
          <ParrotMascot 
            state={
              isRecording ? 'listening' : 
              isTranslating ? 'thinking' : 
              isSpeaking ? 'speaking' : 
              'idle'
            } 
          />
          <div className="center-controls">
            <button className="swap-circle" onClick={swapLanguages}>🔄</button>
            <button className="toy-btn magic-btn" disabled={isTranslating || !sourceText} onClick={() => translateText(sourceText, sourceLang, targetLang)}>
              ✨ Magic Translate!
            </button>
          </div>
        </div>

        {/* Right: Output Side */}
        <section className="dashboard-wing output-wing">
          <div className="wing-header">
            <span className="wing-label">Parrot Says</span>
            <select className="pill-select" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
          <div className="output-container">
            <div className={`giant-output-area ${isTranslating ? 'pulsing' : ''}`}>
              {modelProgress ? (
                <div className="loading-content">
                  <div className="star-loader">🌟</div>
                  <p>{modelProgress}</p>
                </div>
              ) : (
                <p>{translatedText || 'Ready to mimic you! 🦜'}</p>
              )}
            </div>
            {translatedText && !isTranslating && (
              <button className="toy-btn play-btn" onClick={() => speak(translatedText, targetLang)}>
                🔊 Speak Again
              </button>
            )}
          </div>
        </section>
      </div>

    </main>
  );
}
