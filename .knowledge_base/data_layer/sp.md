**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage sp records

- **Query Objective:** Core data store logic for managing sp
- **Schema Link:** DB.sp -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('sp')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for sp
let record = DB.sp.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('sp', ++DB.cnt.sp) };
    DB.sp.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.sp counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
