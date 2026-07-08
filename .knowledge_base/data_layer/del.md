**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage del records

- **Query Objective:** Core data store logic for managing del
- **Schema Link:** DB.del -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('del')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for del
let record = DB.del.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('del', ++DB.cnt.del) };
    DB.del.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.del counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
