# Expo + Nest Starter

Simple starter project with:

- `apps/mobile` - Expo React Native app
- `apps/api` - NestJS backend

## Setup

```bash
npm install
npm run dev
```

Expo: `http://localhost:8081`

Backend: `http://localhost:4000`

Health check: `http://localhost:4000/api/health`

For a physical device, set `EXPO_PUBLIC_API_URL` to your machine's LAN address:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api npm run dev:mobile
```
