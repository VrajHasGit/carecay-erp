**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage pfu records

- **Query Objective:** Core data store logic for managing pfu
- **Schema Link:** DB.pfu -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('pfu')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for pfu
let record = DB.pfu.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('pfu', ++DB.cnt.pfu) };
    DB.pfu.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.pfu counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
