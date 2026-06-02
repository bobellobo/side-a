# album-shuffle

Expo SDK 56 app using Expo Router + TypeScript.

## Requirements

- Node.js 22.x (recommended by Expo SDK 56)
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run start
```

3. Run target platforms:

```bash
npm run android
npm run ios
npm run web
```

## Quality Checks

```bash
npm run lint
npm run typecheck
```

## Project Structure

- `src/app/`: Expo Router routes and layouts
- `assets/`: icons, images, and static assets
- `app.json`: Expo app configuration
- `tsconfig.json`: TypeScript config and path aliases

## Notes

- Routes live in `src/app` (not `app`).
- Keep local environment variables in `.env` files (ignored by git).
- If needed, add a tracked `.env.example` for required variable names only.
