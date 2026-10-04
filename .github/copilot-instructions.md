# HabitPulse Workspace Guidance

- Expo SDK 57 React Native TypeScript app. Expo Router route files live in `app/`.
- Use `npx expo install` for native packages so versions match the installed SDK.
- Keep habit records, notes, reminders, and appearance settings local-first; no network, accounts, analytics, or ad requirements.
- Preserve local calendar-day semantics for completion dates, schedules, and streak calculations.
- Keep domain rules in `src/domain`, platform IO in `src/services`, shared state in hooks/providers, and UI in route or reusable component modules.
- Validate changes with `npm test`, `npx tsc --noEmit`, and `npx expo lint`.
