**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage stk records

- **Query Objective:** Core data store logic for managing stk
- **Schema Link:** DB.stk -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('stk')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for stk
let record = DB.stk.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('stk', ++DB.cnt.stk) };
    DB.stk.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.stk counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
