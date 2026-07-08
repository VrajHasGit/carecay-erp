# System Topology

**Context:** Single Page Application (SPA) Monolith
**Environment:** Client-side only
**Persistence:** `localStorage`
**Dependencies:** FontAwesome (Icons)

## Service Boundaries

```mermaid
graph TD
    Client[Browser]
    LocalDB[(localStorage)]
    External[FontAwesome CDN]
    
    Client -->|Renders UI| Client
    Client <-->|CRUD Operations| LocalDB
    Client -->|Loads Icons| External
```

## Infrastructure details
- No backend server required.
- Everything runs entirely in the browser.
- Data is auto-saved periodically to `localStorage` under `CC_DB_KEY`.
- The `DB` object holds the entire application state in memory.
