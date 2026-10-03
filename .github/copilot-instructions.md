# HabitPulse Workspace Guidance

- This is an Expo SDK 57 React Native TypeScript app.
- Use `npx expo install` for native packages so versions match the installed SDK.
- Keep habit records and appearance settings local-first; avoid introducing network requirements.
- Preserve local calendar-day semantics for completion dates and streak calculations.
- Validate changes with `npx tsc --noEmit` and `npx expo lint`.
