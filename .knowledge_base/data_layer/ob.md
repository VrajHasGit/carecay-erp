**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage ob records

- **Query Objective:** Core data store logic for managing ob
- **Schema Link:** DB.ob -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('ob')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for ob
let record = DB.ob.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('ob', ++DB.cnt.ob) };
    DB.ob.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.ob counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
