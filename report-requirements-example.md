# Report Requirements — Migrated Example

Your existing Report Requirements (Tasks 1–6) in the new format, with added **Acceptance criteria**, **Status**, **Requestee**, and **Dependency** where applicable.

**Estimate unit:** Story points (or hours — define with your team)

---

## Requirements table

| ID | Category | Type | Requirement | Description | Acceptance criteria | Clear? | Estimate | Dependency | Priority | Stack | Status | Start sprint | Target sprint | Release | Requestee dept | Requested by | Assignee | Comments |
|----|----------|------|--------------|-------------|---------------------|--------|----------|------------|----------|-------|--------|--------------|---------------|---------|----------------|--------------|----------|----------|
| VR-001 | VarMiner | Report Requirements | Develop white-label report templates for both domestic and international clients. | Create tailored white-label report templates for both domestic and international clients. Includes branding flexibility and format standardization for external partners. | • Domestic and international template variants exist and are selectable.<br>• Branding (logo, colours) is configurable per client.<br>• Output format is standardized and documented for partners. | Yes | 16 | — | High | 12 | In DEV | July H2 | Aug H2 | Q3-2025 | CRT | CRT team | — | — |
| VR-002 | VarMiner | Report Requirements | Correct the content in the Mitochondrial test report. | Update and correct content in mitochondrial test reports. | • All specified content errors in mitochondrial reports are fixed.<br>• Updated content is reviewed and signed off by CRT/clinical. | Yes | 5 | — | Critical | 1 | Closed | — | — | Q3-2025 | CRT | CRT team | — | Completed. Releasing in v2.8 |
| VR-003 | VarMiner | Report Requirements | Disclaimer content must be replaced for single heterozygous variant. | Revise disclaimers for cases with single heterozygous variants. | • New disclaimer text is defined and approved.<br>• Reports with single heterozygous variant show the updated disclaimer only. | Yes | 10 | — | Critical | 2 | Closed | — | — | Q3-2025 | CRT | CRT team | — | — |
| VR-004 | VarMiner | Report Requirements | Couple carrier report template correction based on respective test code. | Fix formatting and test code–related disclaimer issues in couple carrier reports. | • Formatting matches agreed layout/spec.<br>• Disclaimers are correct for each test code.<br>• No wrong disclaimer for a given test code. | Yes | TBD | — | Critical | 3 | In DEV | — | — | Q3-2025 | CRT | CRT team | — | — |
| VR-005 | VarMiner | Report Requirements | Improved report format for existing panels (WES, etc.). | Enhance design and readability of WES and similar reports. Structured layout, clarity of sections, clinical relevance. More user-friendly and aligned with current standards. | • Layout is structured with clear sections.<br>• Clinical relevance of content is improved and aligned with current standards.<br>• Readability and user-friendliness are validated with CRT/stakeholders. | Yes | 15 | — | High | 9 | In DEV | July H2 | Sep H1 | Q3-2025 | CRT | CRT team | — | — |
| VR-006 | VarMiner | Report Requirements | Automate report generation for all PRS tests. | Automate the generation of reports for all PRS-based tests. | • Scope of “all PRS tests” is defined and listed.<br>• Report generation is automated (no manual steps for standard runs).<br>• Output format and validation rules are documented. | No | TBD | — | Medium | — | Not started | — | — | — | Genessense | Ramamurthy | — | Needs clarification: which PRS tests, format, and triggers. To discuss: report from Clinical software to be shared by Thenral. |

---

## Notes on migration

1. **VR-001, VR-005** — Kept your Start/Target sprint and Status from the lifecycle table; left Assignee for your team to fill.
2. **VR-002, VR-003** — Marked **Closed** with comment “Completed. Releasing in v2.8” where applicable.
3. **VR-004** — Estimate was blank; set to **TBD** with a reminder to estimate after scope is confirmed.
4. **VR-006** — **Clear? = No**: added acceptance criteria that force clarification (scope, format, triggers) and kept your comment about Thenral’s report in **Comments**.
5. **Dependency** — Left as “—” for all; fill when you identify blocking requirements (e.g. “VR-005 depends on VR-001” if panel format uses white-label templates).

Use this file as the reference for how to write **Acceptance criteria** and how to combine **Requirement + Description + Status + Requestee** in one place. You can copy rows into `requirements.csv` or your main requirements doc.
