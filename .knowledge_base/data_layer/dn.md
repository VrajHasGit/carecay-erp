**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage dn records

- **Query Objective:** Core data store logic for managing dn
- **Schema Link:** DB.dn -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('dn')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for dn
let record = DB.dn.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('dn', ++DB.cnt.dn) };
    DB.dn.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.dn counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
