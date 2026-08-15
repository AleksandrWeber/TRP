# PC-09 Market Profile Product — Research Visibility

**Package:** PC-09  
**Date:** 2026-08-15

Market Profile is a research artifact. The operator product makes that visible.

| Surface          | How research is shown                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Nav              | Research band → Profile (not Paper trading)                                                                                              |
| Home copy        | “Versioned research artifact… never forces a trade… does not calculate dimensions.”                                                      |
| Dimensions       | Caller-supplied snapshots. No recalculation on this page.                                                                                |
| Published source | Qualification run ref. Profile does not re-publish from this screen.                                                                     |
| Compare          | Metadata only. Dimension metrics are not diffed.                                                                                         |
| Flags            | `authorityClass: research_artifact`, `forcesTrade: false`, `authorizesSession: false`, `calculatesProfile: false`, `scoresMarket: false` |

Profile remains Orchestrator confidence input (read). It is not execution SoT, not Risk, and not a second Qualification.

---

**End of Research Visibility.**
