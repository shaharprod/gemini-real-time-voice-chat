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


export const useVoiceChat = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcript, setTranscript] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const currentTurnIdRef = useRef<string | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startConversation = useCallback(() => {
    if (status !== AppStatus.IDLE && status !== AppStatus.ERROR) return;

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
          systemInstruction: 'You are a friendly and helpful voice assistant. Keep your responses concise.',
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
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
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
                return newTranscript;
            }
        }
        
        const newTurnId = Date.now().toString();
        currentTurnIdRef.current = newTurnId;
        return [...newTranscript, { id: newTurnId, user: userText, assistant: assistantText, isFinal }];
    });
  };

  return { status, transcript, error, startConversation, stopConversation };
};
