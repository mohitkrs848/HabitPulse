# HabitPulse Product Blueprint

## Product Position

A quiet, offline-first habit tracker for people who want repeatable routines without accounts, ads, tracking, or cloud sync. The core promise is useful daily feedback with local data ownership. HabitPulse does not contain an analytics SDK or a product backend.

## Implemented Architecture

```text
app/                         Expo Router routes
  _layout.tsx                Root providers and native stack
  (tabs)/
    today.tsx                Daily dashboard and progress ring
    habits.tsx               Search, category search, and five filters
    insights.tsx              Daily/weekly/monthly stats, charts, heatmap, badges
    settings.tsx              Theme, categories, backup, reminders, privacy
  habit/
    edit.tsx                 Create and edit habit form
    [id].tsx                 Habit details, notes, history, actions
  privacy.tsx                In-app privacy statement
src/
  domain/
    models.ts                Habit, frequency, settings, and statistics types
    dates.ts                 Local calendar-day helpers
    habitRules.ts            Schedule eligibility, streaks, and rates
    habitSelectors.ts        Active/archive/favorite/completed/missed filters
  hooks/
    useHabitStore.tsx        App state, CRUD, notes, archive, favorite, theme
  services/
    storage.ts               AsyncStorage, schema validation, v1 migration
    reminders.ts             Device-local notification scheduling
    backup.ts                JSON and CSV file export
  theme/
    paperTheme.ts            MD3 light and dark palette
  components/
    HabitCard.tsx            Reusable habit row/actions
    ProgressRing.tsx         Dashboard SVG progress indicator
    Screen.tsx               Safe-area-aware scroll screen
    HabitPulseProviders.tsx  Store, system theme, Paper, Router providers
__tests__/
  habit-rules.test.ts        Local-day, frequency, streak, selector tests
  app-workflows.test.tsx     First run, creation persistence, legacy migration
```

## State And Persistence

- `Habit` stores an id, name, description, category, color, Material Community icon key, frequency, local start date, archived/favorite state, completion records, daily notes keyed by local `YYYY-MM-DD`, reminder times, and timestamps.
- `HabitFrequency` is a discriminated union: `daily`, `hourly` with an every-N-hours interval, `weekly` with a target count, `weekdays` with JavaScript weekday values (Sunday is `0`), and `interval` with an every-N-days interval.
- Completion records are date-keyed. The store toggles a single record per local day, and notes are kept separately so writing a note cannot create a completion or change a streak.
- App settings store theme preference (`system`, `light`, `dark`) and user-created categories.
- AsyncStorage persists one versioned `habitpulse.data.v2` document. The old `habitpulse.v1` prototype data is migrated on first load. JSON import is validated before replacing local state.
- Widget-facing reads should be added behind a `HabitRepository` boundary and a native shared-storage adapter; widgets are intentionally not implemented in this JavaScript-only MVP.

## Navigation And Theme

Expo Router owns navigation. The four bottom tabs are Today, Habits, Insights, and Settings. Habit create/edit and detail routes are stack screens, with a dedicated privacy route. MD3 components use React Native Paper. A saved theme preference overrides the system; `system` follows `useColorScheme`. Safe-area context protects cutout and status-bar insets.

## Screen List

- **Today:** dated greeting, circular completion ring, best active streak, a short active habit list, and a first-run empty state.
- **Habits:** local search across names/categories; active, archived, completed today, missed today, and favorite filters; completion, favorite, edit, archive/restore, duplicate, delete.
- **Habit editor:** name, description, category, color, icon, start date, daily/hourly/weekly/weekdays/interval frequency, favorites, and multiple local reminder times picked from a 24-hour scroll wheel.
- **Habit detail:** current and longest streak, success rate, total completions, completion toggle, per-day note, 35-day heatmap, recent history, and management actions.
- **Insights:** daily/weekly/monthly performance, seven-day line and bar charts, 35-day calendar heatmap, habit success rates, and badge progress.
- **Settings:** theme, custom categories, JSON export/import, CSV completion export, reminder guidance, and privacy route.
- **Privacy:** the in-app privacy promise and storage/backup explanation.

## Wireframes

```text
TODAY                         HABITS
┌───────────────────────┐     ┌───────────────────────────┐
│ TODAY, gently.     ⚙  │     │ Habit library             │
│ ┌──── rhythm ──────┐  │     │ [ Search habits...       ]│
│ │ 2 / 4     ◉ 50%  │  │     │ Active Starred Done Missed│
│ │ streak  6 days   │  │     │ [habit row]        ✓     │
│ └──────────────────┘  │     │ [habit row]        □     │
│ Your habits            │     │                    + Add│
│ [symbol] Read    [✓]   │     └───────────────────────────┘
│ [symbol] Walk    [ ]   │
│       [Create a habit] │     INSIGHTS
│                       │     ┌───────────────────────────┐
│ Today Habits Insights │     │ Today 2/4 Week 68% Month  │
└───────────────────────┘     │ line chart / daily bars   │
                              │ calendar heatmap          │
                              │ badge progress            │
                              └───────────────────────────┘
```

## User Flows

1. **First habit:** Today empty state → create → enter a short name → choose category/frequency/icon/color → save → habit appears locally.
2. **Daily completion:** Today or Habits → tap the check control → progress/streak/history update once for the local date → undo from the same control if needed.
3. **Review and edit:** Habits → search/filter → open details → add a note or review history → edit schedule/reminders, favorite, archive, duplicate, restore, or confirm delete.
4. **Backup:** Settings → export JSON or CSV → Android share sheet → choose a destination. Restore: choose a JSON file → validate → confirm replacement.
5. **Reminder:** Habit editor → add one or more 24-hour times → save → grant local notification permission → schedule on-device; no token registration or server call.

## Component Hierarchy

```text
HabitPulseProviders
├── SafeAreaProvider
├── HabitStoreProvider
└── PaperProvider (MD3 theme)
    └── Expo Router Stack
        ├── Tabs
        │   ├── TodayScreen ── ProgressRing, HabitCard
        │   ├── HabitsScreen ─ HabitCard
        │   ├── InsightsScreen
        │   └── SettingsScreen
        ├── HabitEditScreen
        ├── HabitDetailScreen
        └── PrivacyScreen
```

## MVP Roadmap

1. **MVP foundation (implemented):** local habit lifecycle, schedules, completion history and notes, streaks, theme, filtering, reminders, statistics, achievements, backup/restore, privacy screen, schema migration, Router and Material 3 UI.
2. **Android beta hardening:** run through physical-device sizes and Android 13+ notification permissions; validate import/export through Android's document/share sheets; test backup recovery, timezone changes, DST, app upgrade migration, and accessibility; publish a hosted privacy-policy URL; configure signing and Play Console listing assets.
3. **Play Store release:** internal testing track, closed testing, content rating, target API validation, Data safety answers consistent with the actual binary, release AAB, store screenshots, and staged rollout.

## Future Roadmap

- **Local-first enhancements:** home-screen widgets backed by a repository/native shared-storage adapter, flexible reminder calendars, CSV import, recurring note templates, reorderable routines, accessibility and localization improvements.
- **Optional paid upgrade:** one-time purchase for extra local themes, larger custom icon/color packs, advanced on-device reports, and widget layouts. No ads, telemetry, account, or cloud requirement is planned. Paid features remain usable offline after entitlement is cached, subject to Play billing policy.
- **Not planned:** behavioral analytics, ad identifiers, required signup, or a cloud account.
