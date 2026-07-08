**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage sob records

- **Query Objective:** Core data store logic for managing sob
- **Schema Link:** DB.sob -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('sob')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for sob
let record = DB.sob.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('sob', ++DB.cnt.sob) };
    DB.sob.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.sob counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
