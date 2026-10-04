# Z Route: Hero EXP & Leveling Guide

This guide details the exact Hero Experience (EXP) costs and progression mechanics derived directly from the static Android client version `1.30.07` plaintext data ([`data/heroes.json`](../data/heroes.json)).

An interactive calculator is published on GitHub Pages at **[Z Route Hero EXP Calculator](https://jeffxlabs.github.io/zrouteredemption/hero-exp/)**.

---

## 1. Summary: Brand New to Max Level

Heroes begin brand new at **Level 1** (0 EXP). There are two definitions of "max level" depending on game progression:

| Milestone | Target Level | Headquarters Req | Total EXP (1 Hero) | Full Squad (×5 Heroes) | VS Points (Day 4) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base Game Max Cap** | **Level 150** | **HQ 30** | **5,237,407,280** (~5.24 Billion) | **26,187,036,400** (~26.19B) | **10.47 Billion** |
| **Extended Curve Cap** | **Level 175** | **HQ 35** (*Age of Oil*) | **15,287,407,030** (~15.29 Billion) | **76,437,035,150** (~76.44B) | **30.57 Billion** |

> [!NOTE]
> All 32 playable heroes in [`data/heroes.json`](../data/heroes.json) have their base hero record configured with `"max_level": 150`. The `level_curves` dataset in the client defines upgrade costs up through **Level 175**, unlocking with HQ 31–35 in later season expansions (*Age of Oil*).

---

## 2. Headquarters Gating (HQ × 5)

Hero level cap is hard-gated by your Headquarters (HQ) level:
$$\text{Hero Level Cap} = \text{HQ Level} \times 5$$

| HQ Level | Hero Cap | Total EXP from Lv 1 | Incremental Bracket Cost (+5 Lvls) | VS Event Points (Day 4) |
| :--- | :--- | :--- | :--- | :--- |
| **HQ 20** | Lv 100 | **560,407,780** (~560.4M) | +265,000,000 (Lv 95→100) | 1.12B |
| **HQ 21** | Lv 105 | **760,407,730** (~760.4M) | +200,000,000 | 1.52B |
| **HQ 22** | Lv 110 | **1,000,407,680** (~1.00B) | +240,000,000 | 2.00B |
| **HQ 23** | Lv 115 | **1,290,407,630** (~1.29B) | +290,000,000 | 2.58B |
| **HQ 24** | Lv 120 | **1,640,407,580** (~1.64B) | +350,000,000 | 3.28B |
| **HQ 25** | Lv 125 | **2,030,407,530** (~2.03B) | +390,000,000 | 4.06B |
| **HQ 26** | Lv 130 | **2,480,407,480** (~2.48B) | +450,000,000 | 4.96B |
| **HQ 27** | Lv 135 | **3,010,407,430** (~3.01B) | +530,000,000 | 6.02B |
| **HQ 28** | Lv 140 | **3,612,407,380** (~3.61B) | +602,000,000 | 7.22B |
| **HQ 29** | Lv 145 | **4,362,407,330** (~4.36B) | +750,000,000 | 8.72B |
| **HQ 30** | **Lv 150** | **5,237,407,280** (~5.24B) | **+875,000,000** | **10.47B** |
| **HQ 31** | Lv 155 | **6,387,407,230** (~6.39B) | +1,150,000,000 | 12.77B |
| **HQ 32** | Lv 160 | **7,912,407,180** (~7.91B) | +1,525,000,000 | 15.82B |
| **HQ 33** | Lv 165 | **9,812,407,130** (~9.81B) | +1,900,000,000 | 19.62B |
| **HQ 34** | Lv 170 | **12,237,407,080** (~12.24B) | +2,425,000,000 | 24.47B |
| **HQ 35** | **Lv 175** | **15,287,407,030** (~15.29B) | **+3,050,000,000** | **30.57B** |

---

## 3. Progression Milestones

The table below tracks key levels from brand new (Level 1) through Level 175:

| Level | HQ Req | EXP to Reach That Level | Cumulative EXP (From Lv 1) | % of Base Cap (Lv 150) |
| :--- | :--- | :--- | :--- | :--- |
| **Lv 1** | HQ 1 | 0 | **0** | 0.0% |
| **Lv 10** | HQ 2 | 800 | **4,040** | 0.0001% |
| **Lv 20** | HQ 4 | 2,200 | **19,140** | 0.0004% |
| **Lv 30** | HQ 6 | 24,000 | **120,340** | 0.002% |
| **Lv 40** | HQ 8 | 75,000 | **644,340** | 0.012% |
| **Lv 50** | HQ 10 | 309,990 | **2,268,280** | 0.043% |
| **Lv 60** | HQ 12 | 1,899,990 | **11,908,180** | 0.23% |
| **Lv 70** | HQ 14 | 4,899,990 | **45,308,080** | 0.86% |
| **Lv 80** | HQ 16 | 12,999,990 | **132,407,980** | 2.53% |
| **Lv 90** | HQ 18 | 19,999,990 | **295,407,880** | 5.64% |
| **Lv 100** | HQ 20 | 32,999,990 | **560,407,780** | 10.70% |
| **Lv 110** | HQ 22 | 52,999,990 | **1,000,407,680** | 19.10% |
| **Lv 120** | HQ 24 | 72,999,990 | **1,640,407,580** | 31.32% |
| **Lv 130** | HQ 26 | 92,999,990 | **2,480,407,480** | 47.36% |
| **Lv 140** | HQ 28 | 134,999,990 | **3,612,407,380** | 68.97% |
| **Lv 145** | HQ 29 | 159,999,990 | **4,362,407,330** | 83.29% |
| **Lv 150** | **HQ 30** | **184,999,990** | **5,237,407,280** | **100.0%** |
| **Lv 155** | HQ 31 | 259,999,990 | **6,387,407,230** | 121.96% |
| **Lv 160** | HQ 32 | 334,999,990 | **7,912,407,180** | 151.07% |
| **Lv 165** | HQ 33 | 409,999,990 | **9,812,407,130** | 187.35% |
| **Lv 170** | HQ 34 | 534,999,990 | **12,237,407,080** | 233.65% |
| **Lv 175** | **HQ 35** | **659,999,990** | **15,287,407,030** | **291.89%** |

---

## 4. Key Strategic Mechanics

### Level Curve 1 vs Curve 2
In [`data/heroes.json`](../data/heroes.json), heroes belong to either `level_curve_id: 1` or `level_curve_id: 2`:
* **Cost is Identical**: Both curves have zero difference in Hero EXP costs across all 175 levels.
* **Benefit Multipliers**: Curve 2 heroes (UR combat heroes like Murphy, Kimberly, Marshall, Carlie, Tesla, Swift, etc.) gain larger base HP, ATK, and DEF stat increases per level compared to Curve 1 heroes (SR, SSR, and Support UR Aria).

### Hero EXP vs Hero Shards
* **Leveling**: Consumes only `Hero EXP` (`type: 5`). No gold, food, metal, oil, or shards are required to level up.
* **Star Promotion**: Gated by star tiers and substeps (0 to 5 whole stars, 25 steps total in `star_curve`), which consume hero fragments/shards (`item_Material_universalFragment_*`).

### Resource Allocation
* **Concentrate on Main DPS**: Because EXP scaling accelerates so sharply (Level 120→150 requires 3.6 billion EXP, more than twice the entire cost of Level 1→120), bringing one primary damage dealer (e.g. Kimberly) to Level 150 is vastly more impactful than leveling an entire squad evenly to Level 130.
* **VS Event Timing (Thursday)**: Alliance Duel Day 4 is Hero Day. Saving your Hero EXP items and applying them on Thursday grants 2 VS points per 1 Hero EXP spent, easily completing all event reward milestones.
