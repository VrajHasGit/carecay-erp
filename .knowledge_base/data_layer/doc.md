**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage doc records

- **Query Objective:** Core data store logic for managing doc
- **Schema Link:** DB.doc -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('doc')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for doc
let record = DB.doc.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('doc', ++DB.cnt.doc) };
    DB.doc.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.doc counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
