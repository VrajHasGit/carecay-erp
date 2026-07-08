**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage cust records

- **Query Objective:** Core data store logic for managing cust
- **Schema Link:** DB.cust -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('cust')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for cust
let record = DB.cust.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('cust', ++DB.cnt.cust) };
    DB.cust.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.cust counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
