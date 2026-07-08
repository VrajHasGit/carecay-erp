**Navigation:** [â† Index](../index.md) | [Data Layer](../data_layer/schema-overview.md) | [Component](../components/index.md)

# Feature: user_mgmt

**Source Path:** index.html
**Dependencies:** None external
**Related Data Layer:** [View Entities](../data_layer/schema-overview.md)
**Related Component:** N/A (Monolithic HTML)

---

## Business Logic Intent

This module handles the application flow and user interface interactions exclusively for the user_mgmt workflow. 
- It satisfies the requirement of giving the user a dedicated context/dashboard for this pipeline stage.
- It enables the local data manipulation directly interacting with the global DB variable.

---

## Functional Breakdown

1. 
av('user_mgmt') in index.html â€” Toggles DOM visibility to display the pg_user_mgmt section.
2. enderuser_mgmt() in index.html â€” Iterates through the DB collection to render table rows or KPI widgets.
3. saveRec() in index.html â€” Parses form inputs, validates required fields, updates the DB object, and calls saveDB() to flush to localStorage.

---

## Data Interactions

- **Reads:** DB collections via enderuser_mgmt() -> [Link](../data_layer/schema-overview.md)
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
    Client->>API: Click on user_mgmt menu
    API->>Service: nav('user_mgmt')
    Service->>DB: DB lookup
    DB-->>Service: Return JSON records
    Service-->>API: DOM Update via renderuser_mgmt()
    API-->>Client: Updated screen displayed
``
