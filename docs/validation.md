# Validation record

- Supplied bank: Q01–Q50, 25 legitimate and 25 phishing; all original PNG headers, dimensions, file hashes, and CRCs checked.
- Original Figma screens retrieved with Figma MCP after its limit was increased. Visible artwork and Noto Kufi Arabic fonts are local; no external resource is required during play.
- Reference and rendered idle views compared at the same 9:16 size. Typography, artwork, screen geometry, table rules, input artwork, and button layers checked. Approved screen counts were changed from 20 to the requested 10.
- Production TypeScript/Vite build passes.
- Eleven automated tests cover balanced random selection, no repeats, double-touch protection, exact response-time accumulation, feedback exclusion, full round completion, ranking, email persistence, malformed storage, write failure handling, and save retry deduplication.
- Browser round: Q38, Q09, Q45, Q44, Q39, Q10, Q24, Q06, Q40, Q02. First three intentionally wrong and final seven correct. Result was 7/10; leaderboard retained the result after reload.
- All visible browser images loaded successfully. Touchscreen keyboard entry, email punctuation, registration validation, and the approved instructions flow were checked.
- Windows artifacts are cross-built from macOS. Native Windows execution and the physical 65-inch touchscreen remain target-machine checks.
