# Web Audio Fun

A real-time audio analysis app built with React and the Web Audio API. Detects musical notes, BPM, and key from your microphone input.

## Features

- **Note/Pitch Detection** - Real-time pitch detection using the YIN algorithm
- **Chord Detection** - Polyphonic chord recognition (Major, Minor, 7th, sus, dim, aug)
- **BPM Detection** - Tempo analysis from live audio
- **Key Detection** - Musical key detection (e.g., "C Major", "A minor")
- **Sensitivity Control** - Adjustable gain for quiet instruments (0.5x - 5.0x)
- **Input Level Meter** - Visual feedback showing audio input strength
- **Waveform Visualizer** - Live audio waveform display
- **Recording** - Record, playback, and download audio clips
- **History Log** - Track detected values over time

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Audio Libraries**:
  - [pitchfinder](https://github.com/peterkhayes/pitchfinder) - Pitch detection
  - [realtime-bpm-analyzer](https://github.com/dlepaux/realtime-bpm-analyzer) - BPM detection
  - [essentia.js](https://mtg.github.io/essentia.js/) - Key detection (WASM)
- **Deployment**: GitHub Pages via GitHub Actions

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Click "Start Listening" to enable microphone access
2. Play or sing into your microphone
3. Watch real-time detection of notes, BPM, and musical key
4. Use recording controls to capture and download audio

## Browser Support

Requires a modern browser with Web Audio API and getUserMedia support:
- Chrome (recommended)
- Firefox
- Safari
- Edge

**Note**: Requires HTTPS or localhost for microphone access.

## Live Demo

Visit: https://raytiley.github.io/web-audio-fun/

---

## Generated with Claude

This project was generated entirely by [Claude](https://claude.ai) (Anthropic's AI assistant) using [Claude Code](https://claude.ai/claude-code).

### Original Prompt

> Can we spike out a greenfield react app that deploys to gh-pages. Basically I want it to use the webaudio / userMedia apis to detect notes / beats per minute / and the key it's hearing.
>
> Do some research to see what's possible.
>
> I think most of this should be doable via just web audio and analyzing, but correct me if I'm wrong.
>
> If we need more powerful tools, maybe review if their are any models on hugging face that could do the trick and be used with transformers.js

### What Claude Did

1. Researched Web Audio API capabilities and available JavaScript libraries
2. Created a detailed implementation plan
3. Scaffolded a complete React + TypeScript + Vite project
4. Implemented 6 custom hooks for audio processing
5. Built 6 UI components with CSS modules
6. Set up GitHub Actions for automatic deployment

All code was written in a single session with Claude Code (claude-opus-4-5-20251101).

---

## v2 Improvements: Sensitivity & Chord Detection

### User Feedback That Prompted This Update

> "It detects notes if you are singing pretty loud, nothing for BPM or key. Does not pick up guitar. It's too soft. I wonder if there is something for polyphonic so it can determine chords vs. notes."

### What Was Wrong

1. **Fixed RMS threshold too high** - The app used a hardcoded threshold of `0.01` for silence detection, which was too high for quieter instruments like acoustic guitar
2. **No gain control** - Audio input explicitly disabled `autoGainControl`, with no way to amplify quiet signals
3. **Monophonic only** - The YIN algorithm only detects single notes, not chords

### Implementation Decisions

**For sensitivity issues:**
- Lowered RMS threshold from `0.01` to `0.005` (50% reduction)
- Added a `GainNode` to the audio pipeline: `Source → GainNode → AnalyserNode`
- Created user-adjustable sensitivity slider (0.5x to 5.0x gain)
- Added real-time input level meter so users can see if their audio is being detected

**For chord detection:**
- Chose **chroma-based template matching** over other approaches:
  - ✅ Uses existing FFT data (no new dependencies)
  - ✅ Fast enough for real-time (150ms intervals)
  - ✅ Supports 9 chord types: major, minor, 7, maj7, m7, sus2, sus4, dim, aug
  - ❌ Rejected ML-based approach (too heavy, high latency)
  - ❌ Rejected essentia.js ChordsDetection (experimental quality, limited types)

**Algorithm:**
1. Extract **chroma vector** (12-dimensional pitch class profile) from FFT
2. Compare against **chord templates** using cosine similarity
3. Rotate templates for all 12 root notes
4. Apply **stability filtering** (require 2 consecutive frames) to reduce flickering
5. Display chord with confidence score above 60%

### Files Changed/Added

**Modified:**
- `src/hooks/useAudioInput.ts` - Added GainNode and setGain()
- `src/hooks/usePitchDetection.ts` - Lowered RMS threshold
- `src/hooks/useKeyDetection.ts` - Lowered RMS threshold
- `src/types/audio.ts` - Added ChordInfo types
- `src/App.tsx` - Integrated new components
- `src/App.module.css` - Added input controls styles

**Added:**
- `src/hooks/useChordDetection.ts` - Chord detection hook
- `src/utils/chordHelpers.ts` - Chord templates and matching
- `src/components/ChordDisplay.tsx` - Chord display UI
- `src/components/SensitivitySlider.tsx` - Gain control slider
- `src/components/InputLevel.tsx` - Audio level meter

### Technical Notes

- Chord detection uses **cosine similarity** between the audio's chroma and pre-defined chord templates
- The chroma is computed by mapping FFT frequency bins to the 12 pitch classes (C, C#, D, ..., B)
- Only frequencies between 65Hz and 2000Hz are analyzed (roughly C2 to C7)
- BPM and Key detection were already fully implemented - they just needed the sensitivity fix to work with quieter input

Generated with Claude Code (claude-opus-4-5-20251101).
