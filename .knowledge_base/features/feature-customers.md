**Navigation:** [â† Index](../index.md) | [Data Layer](../data_layer/schema-overview.md) | [Component](../components/index.md)

# Feature: customers

**Source Path:** index.html
**Dependencies:** None external
**Related Data Layer:** [View Entities](../data_layer/schema-overview.md)
**Related Component:** N/A (Monolithic HTML)

---

## Business Logic Intent

This module handles the application flow and user interface interactions exclusively for the customers workflow. 
- It satisfies the requirement of giving the user a dedicated context/dashboard for this pipeline stage.
- It enables the local data manipulation directly interacting with the global DB variable.

---

## Functional Breakdown

1. 
av('customers') in index.html â€” Toggles DOM visibility to display the pg_customers section.
2. endercustomers() in index.html â€” Iterates through the DB collection to render table rows or KPI widgets.
3. saveRec() in index.html â€” Parses form inputs, validates required fields, updates the DB object, and calls saveDB() to flush to localStorage.

---

## Data Interactions

- **Reads:** DB collections via endercustomers() -> [Link](../data_layer/schema-overview.md)
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
    Client->>API: Click on customers menu
    API->>Service: nav('customers')
    Service->>DB: DB lookup
    DB-->>Service: Return JSON records
    Service-->>API: DOM Update via rendercustomers()
    API-->>Client: Updated screen displayed
``
