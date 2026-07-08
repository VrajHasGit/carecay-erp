**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage sal_inq records

- **Query Objective:** Core data store logic for managing sal_inq
- **Schema Link:** DB.sal_inq -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('sal_inq')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for sal_inq
let record = DB.sal_inq.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('sal_inq', ++DB.cnt.sal_inq) };
    DB.sal_inq.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.sal_inq counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
