export interface NoteInfo {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
}

export interface BpmInfo {
  bpm: number | null;
  confidence: number;
}

export interface KeyInfo {
  key: string;
  scale: 'major' | 'minor' | '';
  strength: number;
}

export interface DetectionEvent {
  timestamp: number;
  note: NoteInfo | null;
  bpm: number | null;
  key: KeyInfo | null;
}

export interface AudioInputState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  sourceNode: MediaStreamAudioSourceNode | null;
}

export interface RecorderState {
  isRecording: boolean;
  audioUrl: string | null;
  duration: number;
}
