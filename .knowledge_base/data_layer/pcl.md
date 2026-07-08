**Navigation:** [â† Index](../index.md) | [Schema Overview](./schema-overview.md)

### Query Objective: Manage pcl records

- **Query Objective:** Core data store logic for managing pcl
- **Schema Link:** DB.pcl -> in-memory localStorage
- **Execution Path:** index.html -> saveRec('pcl')
- **Dialect:** JSON

**Query Syntax:**

``javascript
// Simulated Query Syntax for pcl
let record = DB.pcl.find(r => r.id === targetId);
if(!record) {
    record = { id: genId('pcl', ++DB.cnt.pcl) };
    DB.pcl.push(record);
}
// update fields...
saveDB();
``

**Business Rules Embedded in This Query:**
- [Rule 1: Auto-generates ID utilizing DB.cnt.pcl counter]
- [Rule 2: Automatically triggers local storage persist via saveDB()]
