**Navigation:** [â† Index](../index.md) | [Data Layer](../data_layer/schema-overview.md) | [Component](../components/index.md)

# Feature: pur_follow

**Source Path:** index.html
**Dependencies:** None external
**Related Data Layer:** [View Entities](../data_layer/schema-overview.md)
**Related Component:** N/A (Monolithic HTML)

---

## Business Logic Intent

This module handles the application flow and user interface interactions exclusively for the pur_follow workflow. 
- It satisfies the requirement of giving the user a dedicated context/dashboard for this pipeline stage.
- It enables the local data manipulation directly interacting with the global DB variable.

---

## Functional Breakdown

1. 
av('pur_follow') in index.html â€” Toggles DOM visibility to display the pg_pur_follow section.
2. enderpur_follow() in index.html â€” Iterates through the DB collection to render table rows or KPI widgets.
3. saveRec() in index.html â€” Parses form inputs, validates required fields, updates the DB object, and calls saveDB() to flush to localStorage.

---

## Data Interactions

- **Reads:** DB collections via enderpur_follow() -> [Link](../data_layer/schema-overview.md)
- **Writes:** Mutates DB collections via saveRec() -> [Link](../data_layer/schema-overview.md)
- **Side Effects:** Triggers utoCascade() for downstream pipeline creation if applicable.

---

## Sequence Diagram

``mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant DB
    Client->>API: Click on pur_follow menu
    API->>Service: nav('pur_follow')
    Service->>DB: DB lookup
    DB-->>Service: Return JSON records
    Service-->>API: DOM Update via renderpur_follow()
    API-->>Client: Updated screen displayed
``
