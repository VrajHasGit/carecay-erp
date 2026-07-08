# Routing Mapping

**Context:** This application is an SPA where all routing occurs client-side without URL hash changes. Routing is implemented via the `nav(id, el)` function which toggles DOM display classes and invokes a view-specific rendering function.

| Route ID (Method) | Path / View | Handler Function | Role / Domain | Feature Link |
|---|---|---|---|---|
| `dashboard` | Admin Dashboard | `renderDash()` | admin | [Dashboard](../features/feature-dashboard.md) |
| `pur_dashboard` | Purchase Dashboard | `renderPurDash()` | purchase admin | [Purchase Dash](../features/feature-dashboard.md) |
| `sal_dashboard` | Sales Dashboard | `renderSalDash()` | sales admin | [Sales Dash](../features/feature-dashboard.md) |
| `pur_inq` | Purchase Inquiry | `renderPurInq()` | purchase admin | [Purchase Pipeline](../features/feature-purchase.md) |
| `valuation` | Valuation | `renderVal()` | purchase admin | [Purchase Pipeline](../features/feature-purchase.md) |
| `pur_follow` | Purchase Follow-Up | `renderPFU()` | purchase admin | [Purchase Pipeline](../features/feature-purchase.md) |
| `pur_closer` | Purchase Closer | `renderPCL()` | purchase admin | [Purchase Pipeline](../features/feature-purchase.md) |
| `pur_booking` | Order Booking | `renderOB()` | purchase admin | [Purchase Pipeline](../features/feature-purchase.md) |
| `sal_inq` | Sales Inquiry | `renderSalInq()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `sal_follow` | Sales Follow-Up | `renderSFU()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `sal_closer` | Sales Closer | `renderSCL()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `sal_booking` | Sales Order Booking | `renderSOB()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `stock` | Car Stock | `renderStk()` | common | [Car Stock](../features/feature-common.md) |
| `workshop` | Workshop / Refurb | `renderWS()` | common | [Workshop](../features/feature-common.md) |
| `payment` | Payments | `renderPay()` | common | [Payments](../features/feature-common.md) |
| `delivery` | Delivery | `renderDel()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `delivery_note` | Delivery Note | `renderDeliveryNote()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `gate_pass` | Gate Pass | `renderGatePass()` | sales admin | [Sales Pipeline](../features/feature-sales.md) |
| `documents` | Documents | `renderDoc()` | common | [Documents](../features/feature-common.md) |
| `reports` | Reports | `showRpt()` / inline | admin | [Reports](../features/feature-reports.md) |

## Authentication Boundries
Roles include: `admin`, `purchase admin`, `sales admin`. Elements in the sidebar are tagged with `data-role` and filtered on login based on the `CU.role` variable.
