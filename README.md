# Digital Crate

Bring back the intentionality of physical music listening to the streaming era.

Modern streaming platforms clutter your library with individual tracks, algorithmic playlists, and temporary saves. If you want to recreate the feeling of standing in front of a physical CD or vinyl shelf, picking an album, and listening to it from front to back, the current UX of streaming apps falls short.

This application acts as a standalone, digital record shelf. Powered by the Discogs API, users can search, curate, and organize a library of pure album references. You can browse your collection, sort it, or roll the dice for a random album.

When it is time to listen, the app acts as a remote control. Instead of dealing with complex embedded web players and DRM, the app uses universal deep links to instantly open the selected album directly in your native streaming app of choice (Spotify, Apple Music, YouTube).

## Current State

The foundation of the app is currently being laid out. The core architecture is route-first (src/app), utilizing a robust error-handling policy and network architecture. The Discogs API integration is in place, allowing users to search for albums and view details. The next steps involve implementing user authentication with Supabase, enabling album saving and library management features, and refining the UI/UX for a seamless experience.

## Tech Stack & Architecture

This project is built with a highly modern, typed, and resilient stack:

- Framework: Expo SDK 56, React Native 0.85, React 19
- Routing: Expo Router (File-based routing)
- Styling: NativeWind + TailwindCSS
- State & Caching: TanStack React Query v5
- Backend & Auth: Supabase JS v2 (with AsyncStorage for persisted sessions)
- Network & Error Handling: Effect library for typed async flows. Networking is wrapped in a reusable policy (timeout, retry, backoff) with normalized, tagged domain errors (AppError).
- Language: TypeScript (Strict Mode)

## Operational Setup

### Prerequisites

- Node.js: v22.x
- Package Manager: npm

### Environment Variables

Create a .env file in the root directory and add the following required public variables:

Extrait de code

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Available Scripts

Run the following npm scripts to develop and build the project:

- npm start - Starts the Metro bundler.
- npm run android - Opens the app in an Android emulator.
- npm run ios - Opens the app in an iOS simulator.
- npm run web - Serves the app for the web via Metro static web output.
- npm run lint - Runs ESLint based on the Expo configuration.
- npm run typecheck - Validates TypeScript types across the project.

Note: The project utilizes patch-package for dependency patching, which will run automatically post-install.