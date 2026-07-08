**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage pay records

- **Query Objective:** Core data store logic for managing pay
- **Schema Link:** DB.pay -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('pay')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for pay
let record = DB.pay.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('pay', ++DB.cnt.pay) };
    DB.pay.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.pay counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
