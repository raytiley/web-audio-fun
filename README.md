# Web Audio Fun

A real-time audio analysis app built with React and the Web Audio API. Detects musical notes, BPM, and key from your microphone input.

## Features

- **Note/Pitch Detection** - Real-time pitch detection using the YIN algorithm
- **BPM Detection** - Tempo analysis from live audio
- **Key Detection** - Musical key detection (e.g., "C Major", "A minor")
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
