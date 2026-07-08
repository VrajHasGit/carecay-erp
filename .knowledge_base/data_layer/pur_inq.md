**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage pur_inq records

- **Query Objective:** Core data store logic for managing pur_inq
- **Schema Link:** DB.pur_inq -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('pur_inq')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for pur_inq
let record = DB.pur_inq.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('pur_inq', ++DB.cnt.pur_inq) };
    DB.pur_inq.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.pur_inq counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
