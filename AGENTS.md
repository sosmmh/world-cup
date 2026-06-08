# AGENTS.md

## Project

世界杯装懂指南 — WeChat Mini Program for the 2026 FIFA World Cup. Helps casual fans pretend to be experts via quizzes, slang dictionaries, and real-time match data.

## Dev Environment

- **WeChat DevTools** is the only way to build/preview/debug. Open `mini-program/` in DevTools.
- No npm, no test framework, no lint config. The mini-program directory is self-contained.
- `mini-program/project.config.json` sets `miniprogramRoot: "./"` — the mini-program folder is its own root.

## Data Source Switching

`mini-program/config.js` controls the adapter mode:

| `config.adapter` | Behavior |
|---|---|
| `mock` | Local mock data from `data/mockData.js`. No network calls. Good for UI work. |
| `cloud` | Calls WeChat cloud functions. **Current default.** Requires cloud env ID in config. |
| `http` | Calls a backend server. Stub only, not yet implemented. |

When switching to `cloud`: `app.js` auto-initializes `wx.cloud.init()` using `config.cloud.env`.

## Architecture: Dual Switch Points

The project has **two** separate strategy switches, both keyed on `config.adapter`:

1. **Adapter layer** (`adapters/`) — factory in `adapters/index.js` returns `cloudAdapter`, `httpAdapter`, or `mockAdapter`. Used by services that call cloud functions via `wx.cloud.callFunction`.
2. **Service layer** (`services/footballService.js`) — factory that picks from `services/impl/footballMockService.js`, `footballCloudService.js`, or `footballHttpService.js`. These contain the actual business logic and caching.

Both must stay in sync. Changing `config.adapter` switches both.

## Cloud Function: In-Memory DB Pattern

`cloudfunctions/getCompSched/` is the only deployed cloud function. It uses an unusual pattern:

- **Cold start**: loads `staticData.js` (real schedule data) into memory immediately
- **Read layer**: all `getSchedule`, `todayMatches`, `liveScore`, `standings`, `scorers` actions read from in-memory `_db` — never calls external API on read
- **Write layer**: `refreshCache` and `forceRefresh` actions call football-data.org API and update `_db`
- A WeChat cloud timer calls `refreshCache` periodically

The `formatMatch` function exists in **three** places (cloud function, `scripts/fetch-schedule-static.js`, and implicitly in mock service). Keep them consistent when changing match data format.

## Static Data Regeneration

Run `node mini-program/scripts/fetch-schedule-static.js` to re-fetch real schedule data from football-data.org API and regenerate `data/scheduleStaticData.js` (also used by cloud function's `staticData.js`). This script must be run manually when schedule data changes.

Root-level scripts (`fetch_and_build*.js`, `build_teams_basic.js`, `test_person_api.js`) are one-off data generation utilities — not part of the mini-program runtime.

## FBTI 2.0 vs Old MBTI

Two quiz systems coexist in `data/`:

| New (FBTI 2.0) | Old (MBTI) |
|---|---|
| `fbtiQuestions.js` (30 regular + 2 hidden) | `mbtiQuestions.js` (40-question pool) |
| `fbtiProfiles.js` (25 templates + 1 fallback + 1 hidden) | `mbtiResults.js` (10 types) |

The active test page (`pages/mbti/`) uses the FBTI system (`utils/fbtiEngine.js`). The old files are kept for reference but are not used in the UI. The scoring algorithm: 5 models × 15 dimensions, Manhattan distance nearest-neighbor matching against 25 personality templates.

## Cache

`utils/cache.js` wraps `wx.getStorageSync/setStorageSync` with expiration. Cache durations are in `config.cache` (minutes): hotTopics=5, liveScore=1, schedule=15, standings=10, news=10, teams=1440.

## API Keys

Football-Data.org API key is currently hardcoded in `config.js` and `cloudfunctions/getCompSched/index.js`. The free tier limits to 10 calls/minute. API-Football key is placeholder-only (`YOUR_API_FOOTBALL_KEY`).

## Page Structure

11 pages registered in `app.json`. TabBar has 5 tabs: 首页, 赛程, 球队, 工具箱, 我的. (Note: PRD docs say 测试 tab, but actual code uses 工具箱.)

## Key Conventions

- All data files in `data/` use `module.exports = ...` (plain JS modules, not ES modules)
- Each page is a directory with `.js/.json/.wxml/.wxss` four-file set
- Cloud function `getCompSched` is inside `mini-program/cloudfunctions/` (not at repo root)
- Adding a page: create 4 files under `pages/`, register path in `app.json` `pages` array, add to `tabBar.list` if needed
- Color theme: primary `#1a5f2a` (green), accent `#FFD700` (gold), nav bar `#1a1a2e`