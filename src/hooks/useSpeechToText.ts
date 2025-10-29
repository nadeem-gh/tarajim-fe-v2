import { useState, useCallback } from 'react';

interface UseSpeechToTextProps {
  onResult: (transcript: string) => void;
}

interface UseSpeechToTextReturn {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcript: string;
  isSupported: boolean;
}

export const useSpeechToText = ({ onResult }: UseSpeechToTextProps): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported] = useState(
    typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );

  const startRecording = useCallback(() => {
    if (!isSupported) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      onResult(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [isSupported, onResult]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    isSupported
  };
};

