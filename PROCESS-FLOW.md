# Process Flow: equipment_rtt & process_new_additions

## High-Level Pipeline

```
ACUMATICA (OData)
       |
       v
 equipment_rtt             Cron: 7:25 AM daily
   |         
   v         
  [DB] -> [RTT_FEED Board]
              |
              v
 process_new_additions     Cron: :20 and :50 every hour
   |              |
   v              v
 [MMB Board]   [HHM Board]
```

---

## equipment_rtt

Pulls fresh OData from Acumatica, diffs against the database, and syncs
new/removed systems to the RTT_FEED Monday board.

```
                        equipment_rtt (daily 7:25 AM)
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
              Fetch OData    Read DB feed   Read DB removed
              (EquipmentRTT) (rtt_feed)    (rtt_feed_rmv)
                    |             |             |
                    +------+------+-------------+
                           |
                           v
                    diff_by_key(api vs db)
                     by Description field
                           |
                +----------+----------+
                |                     |
                v                     v
          added_rtt[]           removed_rtt[]
                |                     |
                v                     v
       Insert each to DB       Insert to DB
       (rtt_feed table)        (rtt_feed_rmv table)
                |                     |
                v                     v
       Insert ALL to            Insert to Monday
       Monday TOPICS group      REMOVED group
                |
                v
       validateRequiredFields()
       (Description, Modality,
        AddressLine1, Manufacturer,
        ManufacturerID, RemoteCoverage)
                |
         +------+------+
         |             |
         v             v
    All fields     Missing 1+
    present         fields
         |             |
         v             v
    Insert to      Insert to
    NEW_ADDITIONS  MISSING_DATA
    group          group
         |
         v
    Send Teams cards
    (if MMB/HHM eligible
     per RemoteCoverage)
```

### Key details

| Step | Source | Target |
|------|--------|--------|
| Fetch OData | `EquipmentRTT` endpoint (Acumatica) | In-memory array (73 fields) |
| Read DB | `monday.acumatica_rtt_feed` | In-memory array |
| Delta | `diff_by_key()` on Description | `added_rtt[]`, `removed_rtt[]` |
| DB insert (new) | added systems | `monday.acumatica_rtt_feed` (74 cols) |
| DB insert (removed) | removed systems | `monday.acumatica_rtt_feed_rmv` |
| Monday insert | all new systems | RTT_FEED > TOPICS group |
| Validation split | `validateRequiredFields()` | NEW_ADDITIONS or MISSING_DATA |
| Monday insert (removed) | removed systems | RTT_FEED > REMOVED group |
| Teams notification | MMB/HHM eligible systems | Remote Technology channel |

---

## process_new_additions

Reads items from the RTT_FEED NEW_ADDITIONS group that have a SUB_GROUP
assigned, then routes them to the appropriate workflow board (MMB or HHM).

```
            process_new_additions (every :20 and :50)
                          |
                          v
              Fetch Monday RTT_FEED board
              NEW_ADDITIONS group items
              (cursor-based pagination)
                          |
                          v
              Filter: only items with
              SUB_GROUP column assigned
                          |
                          v
              For each item:
              Convert Monday columns -> system object
                          |
                          v
              Lookup RemoteCoverage in
              remoteCoverageMatrix
                          |
              +-----------+-----------+
              |                       |
              v                       v
        routeToMmb?             routeToHhm?
        (mmb=true OR            (hhm=true OR
         Modality="MRI")         hhm=null/unknown)
              |                       |
              v                       v
        format_for_mmb_workflow  format_for_hhm_workflow
        - CustomerName           - Filter to 24 valid cols
        - Model + Description    - Set 4 status cols = "NEW"
        - Serial, SubGroup       - Map shared RTT columns
        - SiteAddress             |
              |                   |
              v                   v
        Insert to              Insert to
        MMB_CUST_WORKFLOW      HHM_CUST_WORKFLOW
        board (topics group)   board (PLANNING_REVIEW)
              |                   |
              +--------+----------+
                       |
                       v
              Move source item to
              WORKFLOW_PROCESSED group
              on RTT_FEED board
```

### Key details

| Step | Source | Target |
|------|--------|--------|
| Fetch items | Monday RTT_FEED > NEW_ADDITIONS | In-memory items array |
| Filter | Items where SUB_GROUP is non-empty | `itemsWithSubGroup[]` |
| Transform | Monday column values | System object (72 fields) |
| Route decision | `getCoverageInfo(RemoteCoverage)` + Modality check | MMB and/or HHM |
| MMB insert | formatted system | MMB_CUST_WORKFLOW > topics |
| HHM insert | formatted system | HHM_CUST_WORKFLOW > PLANNING_REVIEW |
| Archive | processed item | RTT_FEED > WORKFLOW_PROCESSED |

---

## Monday Board Group Lifecycle

```
RTT_FEED Board
+--------------------------------------------------+
| TOPICS             <- All new systems land here   |
| NEW_ADDITIONS      <- Complete data, awaiting     |
|                       SUB_GROUP assignment         |
| MISSING_DATA       <- Incomplete, needs review    |
| REMOVED            <- No longer in OData          |
| WORKFLOW_PROCESSED <- Routed to MMB/HHM boards    |
+--------------------------------------------------+
         |                          |
         v                          v
 MMB_CUST_WORKFLOW          HHM_CUST_WORKFLOW
+-------------------+   +---------------------+
| topics            |   | PLANNING_REVIEW     |
| (Planning Review) |   |                     |
+-------------------+   +---------------------+
```

---

## Coverage Routing Matrix

| RemoteCoverage Value     | HHM | MMB |
|--------------------------|-----|-----|
| Avante Connect Only      | Yes | No  |
| Avante Vision            | Yes | No  |
| Avante Magnet Monitoring | No  | Yes |
| Avante MRI Bundle        | Yes | Yes |
| Avante CT/CATH Bundle    | Yes | No  |
| Refused / Unknown / null | Yes*| No  |

\* Defaults to HHM when coverage is unknown or null.

**Special rule:** Modality = `"MRI"` always routes to MMB (in addition to any HHM routing).
