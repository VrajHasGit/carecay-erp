**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage scl records

- **Query Objective:** Core data store logic for managing scl
- **Schema Link:** DB.scl -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('scl')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for scl
let record = DB.scl.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('scl', ++DB.cnt.scl) };
    DB.scl.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.scl counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
