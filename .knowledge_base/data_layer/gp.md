**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage gp records

- **Query Objective:** Core data store logic for managing gp
- **Schema Link:** DB.gp -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('gp')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for gp
let record = DB.gp.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('gp', ++DB.cnt.gp) };
    DB.gp.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.gp counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
