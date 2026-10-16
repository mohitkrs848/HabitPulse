# HabitPulse

An Android-first, privacy-focused habit tracker built with Expo SDK 57, Expo Router, TypeScript, React Native Paper (Material 3), and AsyncStorage. Habit records stay on-device; the app requires no account, network, ads, analytics, or cloud service.

## Features

- Create, edit, duplicate, archive, restore, and delete habits.
- Daily, weekly target, weekday, and every-N-days schedules.
- Local-day completion, undo, streaks, completion history, and daily notes.
- Favorites, name/category/description search, category and active/archived/completed/missed filters.
- Multiple local reminder times per habit.
- Daily/weekly/monthly insight cards, line and bar charts, calendar heatmap, per-habit success rates, and achievement progress.
- JSON backup and restore, CSV completion export, and local categories.
- System/light/dark themes and cutout-aware safe areas.

## Run

```sh
npm install
npx expo start
```

Open the QR code in Expo Go for local UI work. In the current Android Expo Go client, reminder scheduling is unavailable; the app remains usable and explains that reminders need a development build. Build with `npx expo run:android` or EAS before testing local reminders. Android commands are `npm run android` and `npx expo run:android` when a local Android SDK is configured.

## Checks

```sh
npm test
npx tsc --noEmit
npx expo lint
npx expo install --check
npx expo export --platform android
```

## Architecture And Release

- Router screens are in `app/`; app state and platform services are in `src/`.
- The `habitpulse.data.v2` AsyncStorage document is schema-versioned. The previous `habitpulse.v1` prototype data is migrated on first load.
- Schedules and streaks use local `YYYY-MM-DD` calendar keys. Daily notes are separate from completion records.
- `eas.json` includes development APK, internal preview APK, and production Android App Bundle profiles.
- Product architecture, data models, screen list, flows, wireframes, and roadmap: [docs/PRODUCT_BLUEPRINT.md](docs/PRODUCT_BLUEPRINT.md).
- Listing content and release checklist: [docs/PLAY_STORE_LISTING.md](docs/PLAY_STORE_LISTING.md).
- Privacy policy draft: [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md).

Before Play submission, publish the privacy policy at an HTTPS URL, replace the starter Expo icon assets with final store assets, build and test a signed AAB on physical Android devices, and confirm the Play Console Data safety form against the exact release binary and bundled SDKs. Do not claim release-ready until those checks are complete.
