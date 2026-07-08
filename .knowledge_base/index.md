# Knowledge Base â€” Carecay Used Car

> Generated: 2026-06-13 | Framework: Vanilla JS / HTML | Compiled by: systemic-codebase-decomposition v1.0.0

## Quick Navigation

- [System Topology](./architecture/system-topology.md)
- [Data Flow](./architecture/data-flow.md)
- [API Routing](./architecture/api-routing.md)
- [Schema Overview](./data_layer/schema-overview.md)

---

## Features

| Feature | Source Path | Data Layer | Component |
|---|---|---|---|
| [Purchase Pipeline](./features/feature-purchase.md) | `index.html` | [pur_inq](./data_layer/pur_inq.md) | N/A |
| [Sales Pipeline](./features/feature-sales.md) | `index.html` | [sal_inq](./data_layer/sal_inq.md) | N/A |

---

## Data Layer

| Entity | Table | ORM Model | File |
|---|---|---|---|
| Purchase Inquiry | `pur_inq` | In-memory Object | [pur_inq.md](./data_layer/pur_inq.md) |

---

## Architecture Decisions Log

- **2026-06-13:** Chose a monolithic `index.html` containing all templates and logic due to simplicity.
- **2026-06-13:** Implemented a naive schema via the single `DB` object, storing in `localStorage`. Merged `USED CAR FINAL.html` custom Delivery and Document quick buttons into the `index.html` file that has persistent storage and auto-notification badge features.

---

## Complete Features Index

| Feature | File |
|---|---|
| feature-customers | [./features/feature-customers.md](./features/feature-customers.md) |
| feature-dashboard | [./features/feature-dashboard.md](./features/feature-dashboard.md) |
| feature-delivery | [./features/feature-delivery.md](./features/feature-delivery.md) |
| feature-delivery_note | [./features/feature-delivery_note.md](./features/feature-delivery_note.md) |
| feature-documents | [./features/feature-documents.md](./features/feature-documents.md) |
| feature-emp_perf | [./features/feature-emp_perf.md](./features/feature-emp_perf.md) |
| feature-gate_pass | [./features/feature-gate_pass.md](./features/feature-gate_pass.md) |
| feature-payment | [./features/feature-payment.md](./features/feature-payment.md) |
| feature-purchase | [./features/feature-purchase.md](./features/feature-purchase.md) |
| feature-pur_booking | [./features/feature-pur_booking.md](./features/feature-pur_booking.md) |
| feature-pur_closer | [./features/feature-pur_closer.md](./features/feature-pur_closer.md) |
| feature-pur_dashboard | [./features/feature-pur_dashboard.md](./features/feature-pur_dashboard.md) |
| feature-pur_follow | [./features/feature-pur_follow.md](./features/feature-pur_follow.md) |
| feature-pur_inq | [./features/feature-pur_inq.md](./features/feature-pur_inq.md) |
| feature-reports | [./features/feature-reports.md](./features/feature-reports.md) |
| feature-sales | [./features/feature-sales.md](./features/feature-sales.md) |
| feature-sale_process | [./features/feature-sale_process.md](./features/feature-sale_process.md) |
| feature-sal_booking | [./features/feature-sal_booking.md](./features/feature-sal_booking.md) |
| feature-sal_closer | [./features/feature-sal_closer.md](./features/feature-sal_closer.md) |
| feature-sal_dashboard | [./features/feature-sal_dashboard.md](./features/feature-sal_dashboard.md) |
| feature-sal_follow | [./features/feature-sal_follow.md](./features/feature-sal_follow.md) |
| feature-sal_inq | [./features/feature-sal_inq.md](./features/feature-sal_inq.md) |
| feature-stock | [./features/feature-stock.md](./features/feature-stock.md) |
| feature-test_drive | [./features/feature-test_drive.md](./features/feature-test_drive.md) |
| feature-user_mgmt | [./features/feature-user_mgmt.md](./features/feature-user_mgmt.md) |
| feature-valuation | [./features/feature-valuation.md](./features/feature-valuation.md) |
| feature-workshop | [./features/feature-workshop.md](./features/feature-workshop.md) |

---

## Complete Data Layer Index

| Entity | File |
|---|---|
| cust | [./data_layer/cust.md](./data_layer/cust.md) |
| del | [./data_layer/del.md](./data_layer/del.md) |
| dn | [./data_layer/dn.md](./data_layer/dn.md) |
| doc | [./data_layer/doc.md](./data_layer/doc.md) |
| gp | [./data_layer/gp.md](./data_layer/gp.md) |
| ob | [./data_layer/ob.md](./data_layer/ob.md) |
| pay | [./data_layer/pay.md](./data_layer/pay.md) |
| pcl | [./data_layer/pcl.md](./data_layer/pcl.md) |
| pfu | [./data_layer/pfu.md](./data_layer/pfu.md) |
| pur_inq | [./data_layer/pur_inq.md](./data_layer/pur_inq.md) |
| sal_inq | [./data_layer/sal_inq.md](./data_layer/sal_inq.md) |
| scl | [./data_layer/scl.md](./data_layer/scl.md) |
| sfu | [./data_layer/sfu.md](./data_layer/sfu.md) |
| sob | [./data_layer/sob.md](./data_layer/sob.md) |
| sp | [./data_layer/sp.md](./data_layer/sp.md) |
| stk | [./data_layer/stk.md](./data_layer/stk.md) |
| val | [./data_layer/val.md](./data_layer/val.md) |
| ws | [./data_layer/ws.md](./data_layer/ws.md) |

