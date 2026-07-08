**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage ws records

- **Query Objective:** Core data store logic for managing ws
- **Schema Link:** DB.ws -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('ws')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for ws
let record = DB.ws.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('ws', ++DB.cnt.ws) };
    DB.ws.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.ws counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
