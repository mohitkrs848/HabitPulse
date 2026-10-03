# HabitPulse

A small Expo React Native habit tracker for building consistency and keeping daily streaks.

## Features

- Add as many habits as you need, with a symbol and color.
- Edit habit names, symbols, and colors, or delete habits after confirmation.
- Mark habits complete for the current local calendar day.
- See each habit's active streak and today's overall progress.
- Switch between light and dark themes.
- Keep habits and theme settings on-device with AsyncStorage. The app works offline and does not require an account.
- Respect device safe areas so content stays clear of Android status bars and camera cutouts.

The app starts with a few sample habits so the tracker is ready to explore. Data is stored locally on the device and is not synchronized between devices.

## Run

```sh
npm install
npx expo start
```

Use the Expo Go app to open the QR code, or run a target directly:

```sh
npm run android
npm run ios
npm run web
```

Building for iOS locally requires macOS. Type-check and lint with:

```sh
npx tsc --noEmit
npx expo lint
```

## Tests

Run the screen-level React Native tests with:

```sh
npm test
```

The tests cover the starter habit list and local-day progress, adding/editing/deleting habits, completing and undoing them, streak updates, theme switching, and saving/restoring habits and theme with AsyncStorage. They run the actual React Native screen with the Expo SDK 57 preset; no emulator is required for this fast feedback loop. These are component-level tests, not Android emulator/device instrumentation tests.

Before an Android build, run the full local checks:

```sh
npm test
npx tsc --noEmit
npx expo lint
npx expo install --check
```
