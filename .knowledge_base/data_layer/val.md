**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage val records

- **Query Objective:** Core data store logic for managing val
- **Schema Link:** DB.val -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('val')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for val
let record = DB.val.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('val', ++DB.cnt.val) };
    DB.val.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.val counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
