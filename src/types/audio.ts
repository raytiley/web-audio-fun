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

export type ChordQuality =
  | 'major'
  | 'minor'
  | '7'
  | 'maj7'
  | 'm7'
  | 'sus2'
  | 'sus4'
  | 'dim'
  | 'aug';

export interface ChordInfo {
  root: string;
  quality: ChordQuality;
  name: string;
  confidence: number;
  notes: string[];
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
  gainNode: GainNode | null;
}

export interface RecorderState {
  isRecording: boolean;
  audioUrl: string | null;
  duration: number;
}
