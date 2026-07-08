**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage sfu records

- **Query Objective:** Core data store logic for managing sfu
- **Schema Link:** DB.sfu -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('sfu')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for sfu
let record = DB.sfu.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('sfu', ++DB.cnt.sfu) };
    DB.sfu.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.sfu counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
