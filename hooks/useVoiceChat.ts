import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from "@google/genai";
import { AppStatus, ConversationTurn } from '../types';

// --- Audio Utility Functions ---

// Base64 encoding
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 decoding
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const STORAGE_KEY = 'gemini-voice-chat-history';

export const useVoiceChat = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcript, setTranscript] = useState<ConversationTurn[]>(() => {
    // Load saved history from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.error('Failed to load saved history:', err);
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const isDictationModeRef = useRef<boolean>(false);
  
  const currentTurnIdRef = useRef<string | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startDictationOnly = useCallback(() => {
    if (status !== AppStatus.IDLE && status !== AppStatus.ERROR) return;

    // Check if browser supports Speech Recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setStatus(AppStatus.TRANSCRIBING);
    setError(null);
    isDictationModeRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'he-IL'; // Hebrew, can be changed to 'en-US' or other languages

      let currentUserText = '';
      let currentTurnId = Date.now().toString();

      recognition.onstart = () => {
        setStatus(AppStatus.TRANSCRIBING);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        currentUserText = finalTranscript || interimTranscript;

        // Update transcript with user input only (no assistant response)
        setTranscript(prev => {
          const newTranscript = [...prev];
          const turnIndex = newTranscript.findIndex(t => t.id === currentTurnId);
          
          if (turnIndex !== -1) {
            newTranscript[turnIndex] = {
              ...newTranscript[turnIndex],
              user: currentUserText.trim(),
              assistant: '', // No assistant response in dictation mode
              isFinal: !!finalTranscript
            };
          } else if (currentUserText.trim()) {
            newTranscript.push({
              id: currentTurnId,
              user: currentUserText.trim(),
              assistant: '',
              isFinal: !!finalTranscript
            });
          }

          // Save to localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTranscript));
          } catch (err) {
            console.error('Failed to save history:', err);
          }

          return newTranscript;
        });

        // Start new turn for final results
        if (finalTranscript) {
          currentTurnId = Date.now().toString();
          currentUserText = '';
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // This is common, just continue listening
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
        setStatus(AppStatus.ERROR);
      };

      recognition.onend = () => {
        if (isDictationModeRef.current && status === AppStatus.TRANSCRIBING) {
          // Restart recognition if still in dictation mode
          try {
            recognition.start();
          } catch (err) {
            // Recognition might already be starting
            console.log('Recognition already starting or stopped');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start dictation:', err);
      setError(err.message || 'Failed to initialize speech recognition.');
      setStatus(AppStatus.ERROR);
      isDictationModeRef.current = false;
    }
  }, [status]);

  const startConversation = useCallback(() => {
    if (status !== AppStatus.IDLE && status !== AppStatus.ERROR) return;

    // Stop dictation mode if active
    if (isDictationModeRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isDictationModeRef.current = false;
    }

    setStatus(AppStatus.CONNECTING);
    setError(null);
    setTranscript([]);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === '') {
        const errorMsg = 'GEMINI_API_KEY is not set. ' + 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'Please create a .env.local file with your Gemini API key.'
            : 'Please configure GEMINI_API_KEY in GitHub Secrets for deployment.');
        throw new Error(errorMsg);
      }
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      
      // FIX: Add `(window as any)` to support `webkitAudioContext` in TypeScript for broader browser compatibility.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are a friendly and helpful voice assistant with access to real-time internet search through Google Search. When users ask about current events, recent news, weather, stock prices, or any information that requires up-to-date data, you MUST search the internet using your grounding capabilities and provide accurate, current information with sources when possible. Keep your responses concise.',
          // Enable Google Search grounding for real-time internet search
          groundingWithGoogleSearch: {
            enabled: true,
          },
        },
        callbacks: {
          onopen: async () => {
            setStatus(AppStatus.LISTENING);
            try {
              // Start streaming audio from microphone
              const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              // Verify we have valid AudioContext and MediaStream
              if (!inputAudioContextRef.current) {
                throw new Error('AudioContext not initialized');
              }
              
              // Resume AudioContext if suspended (browser autoplay policy)
              if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
              }
              
              if (!mediaStream || !mediaStream.getTracks().length) {
                throw new Error('Failed to get media stream');
              }
              
              // Verify MediaStream has active audio tracks
              const audioTracks = mediaStream.getAudioTracks();
              if (!audioTracks.length || audioTracks.every(track => track.readyState !== 'live')) {
                throw new Error('No active audio tracks in media stream');
              }
              
              mediaStreamRef.current = mediaStream;
              const source = inputAudioContextRef.current.createMediaStreamSource(mediaStream);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };

                if (sessionPromiseRef.current) {
                  sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              };
              source.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            } catch (error: any) {
              console.error('Error setting up audio:', error);
              setError(`Failed to set up microphone: ${error.message || 'Unknown error'}`);
              setStatus(AppStatus.ERROR);
              cleanup();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            handleServerMessage(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('API Error:', e);
            setError(`Connection error: ${e.message}`);
            setStatus(AppStatus.ERROR);
            cleanup();
          },
          onclose: () => {
             cleanup();
          },
        },
      });

    } catch (err: any) {
        console.error("Failed to start conversation:", err);
        setError(err.message || 'Failed to initialize Gemini API.');
        setStatus(AppStatus.ERROR);
    }
  }, [status]);

  const stopConversation = useCallback(() => {
    // Stop dictation mode if active
    if (isDictationModeRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isDictationModeRef.current = false;
    }
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
    // Stop dictation mode
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
      recognitionRef.current = null;
    }
    isDictationModeRef.current = false;
    
    setStatus(AppStatus.IDLE);
    
    // Stop microphone stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }

    // Stop playback
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        outputAudioContextRef.current.close();
    }
    
    nextStartTimeRef.current = 0;
    currentTurnIdRef.current = null;
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
  }, []);

  const handleServerMessage = async (message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      currentInputTranscriptionRef.current += text;
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, false);
    }

    if (message.serverContent?.outputTranscription) {
      setStatus(AppStatus.SPEAKING);
      const text = message.serverContent.outputTranscription.text;
      currentOutputTranscriptionRef.current += text;
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, false);
    }
    
    if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
        setStatus(AppStatus.SPEAKING);
        const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
        const outputAudioContext = outputAudioContextRef.current;
        if (outputAudioContext) {
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputAudioContext.destination);
          
          source.addEventListener('ended', () => {
            audioSourcesRef.current.delete(source);
          });
          
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += audioBuffer.duration;
          audioSourcesRef.current.add(source);
        }
    }

    if (message.serverContent?.interrupted) {
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }
    
    if (message.serverContent?.turnComplete) {
      updateTranscript(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current, true);
      currentTurnIdRef.current = null;
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
      setStatus(AppStatus.LISTENING);
    }
  };
  
  const updateTranscript = (userText: string, assistantText: string, isFinal: boolean) => {
    setTranscript(prev => {
        const newTranscript = [...prev];
        if (currentTurnIdRef.current) {
            const turnIndex = newTranscript.findIndex(t => t.id === currentTurnIdRef.current);
            if (turnIndex !== -1) {
                newTranscript[turnIndex] = { ...newTranscript[turnIndex], user: userText, assistant: assistantText, isFinal };
                // Save to localStorage
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(newTranscript));
                } catch (err) {
                  console.error('Failed to save history:', err);
                }
                return newTranscript;
            }
        }
        
        const newTurnId = Date.now().toString();
        currentTurnIdRef.current = newTurnId;
        const updated = [...newTranscript, { id: newTurnId, user: userText, assistant: assistantText, isFinal }];
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to save history:', err);
        }
        return updated;
    });
  };

  const saveHistoryToFile = useCallback(() => {
    try {
      const dataStr = JSON.stringify(transcript, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gemini-chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save history to file:', err);
      throw new Error('Failed to save history to file');
    }
  }, [transcript]);

  const saveHistoryToTxt = useCallback(() => {
    try {
      if (transcript.length === 0) {
        throw new Error('No conversation history to export');
      }

      let textContent = '';
      
      transcript.forEach((turn, index) => {
        if (turn.user.trim()) {
          textContent += `User: ${turn.user}\n`;
        }
        if (turn.assistant.trim()) {
          textContent += `Assistant: ${turn.assistant}\n`;
        }
        // Add separator between turns (except for the last one)
        if (index < transcript.length - 1) {
          textContent += '\n---\n\n';
        }
      });

      const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gemini-chat-text-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save history to TXT:', err);
      throw new Error('Failed to save history to TXT file');
    }
  }, [transcript]);

  const clearHistory = useCallback(() => {
    setTranscript([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear saved history:', err);
    }
  }, []);

  const loadHistoryFromFile = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setTranscript(parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (err) {
          reject(new Error('Failed to parse file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // State for text-to-speech
  const [isReading, setIsReading] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const readHistoryAloud = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (transcript.length === 0) {
      alert('No history to read. Please load a history file first.');
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;
    
    // Combine all messages into one text
    const fullText = transcript
      .map(turn => {
        const userText = turn.user ? `User: ${turn.user}` : '';
        const assistantText = turn.assistant ? `Assistant: ${turn.assistant}` : '';
        return [userText, assistantText].filter(Boolean).join('\n');
      })
      .filter(Boolean)
      .join('\n\n');

    if (!fullText.trim()) {
      alert('No readable content in history.');
      return;
    }

    setIsReading(true);

    const utterance = new SpeechSynthesisUtterance(fullText);
    currentUtteranceRef.current = utterance;

    // Configure voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoices = voices.filter(v => 
      v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google')
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsReading(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      currentUtteranceRef.current = null;
      alert('Error reading history. Please try again.');
    };

    speechSynthesisRef.current.speak(utterance);
  }, [transcript]);

  const stopReading = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsReading(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  const readTextFile = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (!text.trim()) {
      alert('No text to read.');
      return;
    }

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    speechSynthesisRef.current = window.speechSynthesis;

    setIsReading(true);

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    // Configure voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoices = voices.filter(v => 
      v.lang.includes('he') || v.lang.includes('en') || v.name.includes('Google')
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsReading(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      currentUtteranceRef.current = null;
      alert('Error reading text. Please try again.');
    };

    speechSynthesisRef.current.speak(utterance);
  }, []);

  const loadTextFile = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (content && content.trim()) {
            resolve();
          } else {
            reject(new Error('File is empty'));
          }
        } catch (err) {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return { 
    status, 
    transcript, 
    error, 
    startConversation,
    startDictationOnly,
    stopConversation,
    saveHistoryToFile,
    saveHistoryToTxt,
    clearHistory,
    loadHistoryFromFile,
    readHistoryAloud,
    stopReading,
    isReading,
    readTextFile,
    loadTextFile
  };
};
