# Schema Overview

## Master ER Diagram

```mermaid
erDiagram
    pur_inq ||--o{ val : "1:N"
    pur_inq ||--o{ pfu : "1:N"
    pur_inq ||--o| pcl : "1:1"
    pcl ||--o| ob : "1:1"
    
    sal_inq ||--o{ sfu : "1:N"
    sal_inq ||--o| scl : "1:1"
    scl ||--o| sob : "1:1"
    
    ob ||--o{ pay : "1:N (Purchase Payments)"
    ob ||--o{ doc : "1:N (Purchase Docs)"
    ob ||--o| stk : "1:1 (To Stock)"
    
    sob ||--o{ pay : "1:N (Sale Payments)"
    sob ||--o{ doc : "1:N (Sale Docs)"
    sob ||--o| del : "1:1"
    
    stk ||--o{ ws : "1:N"
    
    pur_inq {
        string id PK "e.g. INQ1"
        string sellerName
        string status
    }
    val {
        string id PK
        string inqId FK "-> pur_inq.id"
    }
    pcl {
        string id PK
        string inqId FK "-> pur_inq.id"
        number price
    }
    ob {
        string id PK
        string closerId FK "-> pcl.id"
    }
    sal_inq {
        string id PK "e.g. SIN1"
        string buyerName
    }
    scl {
        string id PK
        string inqId FK "-> sal_inq.id"
        number final
    }
    sob {
        string id PK
        string sclId FK "-> scl.id"
    }
    stk {
        string id PK
        string obId FK "-> ob.id"
        string status
    }
    pay {
        string id PK
        string obId FK "-> ob.id"
        string sobId FK "-> sob.id"
        number amt
    }
    doc {
        string id PK
        string obId FK "-> ob.id"
        string sobId FK "-> sob.id"
    }
```

## Entities

| Entity | Table / Collection | ORM Model / Type | File |
|---|---|---|---|
| Purchase Inquiry | `pur_inq` | In-memory Object | [pur_inq.md](./pur_inq.md) |
| Valuation | `val` | In-memory Object | [val.md](./val.md) |
| Purchase Follow-Up | `pfu` | In-memory Object | [pfu.md](./pfu.md) |
| Purchase Closer | `pcl` | In-memory Object | [pcl.md](./pcl.md) |
| Order Booking | `ob` | In-memory Object | [ob.md](./ob.md) |
| Sales Inquiry | `sal_inq` | In-memory Object | [sal_inq.md](./sal_inq.md) |
| Sales Follow-Up | `sfu` | In-memory Object | [sfu.md](./sfu.md) |
| Sales Closer | `scl` | In-memory Object | [scl.md](./scl.md) |
| Sales Order Booking | `sob` | In-memory Object | [sob.md](./sob.md) |
| Car Stock | `stk` | In-memory Object | [stk.md](./stk.md) |
| Workshop | `ws` | In-memory Object | [ws.md](./ws.md) |
| Payment | `pay` | In-memory Object | [pay.md](./pay.md) |
| Delivery | `del` | In-memory Object | [del.md](./del.md) |
| Documents | `doc` | In-memory Object | [doc.md](./doc.md) |
| Customer | `cust` | In-memory Object | [cust.md](./cust.md) |
| Delivery Note | `dn` | In-memory Object | [dn.md](./dn.md) |
| Gate Pass | `gp` | In-memory Object | [gp.md](./gp.md) |
| Sale Process | `sp` | In-memory Object | [sp.md](./sp.md) |
