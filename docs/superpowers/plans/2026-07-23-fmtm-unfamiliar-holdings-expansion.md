# FMTM Unfamiliar Holdings Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the paragraph about FMTM's unfamiliar holdings into an essay-like bridge about familiarity bias, model trust, and rebalancing frequency.

**Architecture:** Make one localized MDX copy edit between the existing holdings observation and the next section heading. Preserve the user's sentence and image, add three short paragraphs, then verify MDX linting and the rendered article.

**Tech Stack:** MDX, Next.js 13, Contentlayer, pnpm

## Global Constraints

- Preserve all existing article copy and media outside the insertion point.
- Match the article's first-person, essay-like Chinese voice.
- Do not add new factual claims that require external sourcing.
- End with a natural transition into the section on momentum time horizons.

---

### Task 1: Expand the unfamiliar-holdings reflection

**Files:**
- Modify: `content/posts/fmtm-etf.mdx:40`

**Interfaces:**
- Consumes: The existing sentence ending in “更遑论对其公司基本面或者盘面的理解。”
- Produces: Three paragraphs immediately before `## 不同动能策略的时间因子`.

- [ ] **Step 1: Re-read the insertion point**

Run: `rg -n -C 8 "除了高盛戴尔" content/posts/fmtm-etf.mdx`

Expected: The target sentence is followed directly by the next section heading.

- [ ] **Step 2: Insert the three-paragraph reflection**

The copy should move through these exact ideas: unfamiliarity as a normal stock-picking veto; unfamiliar names as evidence that a full-market screen is not just recycling famous winners; and the resulting need to trust the model's exit discipline and rebalance cadence.

- [ ] **Step 3: Verify source placement**

Run: `rg -n -C 18 "某种意义上" content/posts/fmtm-etf.mdx`

Expected: The new copy appears once, after the user's sentence and before the next heading.

- [ ] **Step 4: Verify MDX and page rendering**

Run: `pnpm lint`

Expected: Exit code 0 with no lint errors.

Run: `curl -I http://localhost:3000/posts/fmtm-etf`

Expected: HTTP 200.

- [ ] **Step 5: Inspect the rendered transition**

Open `http://localhost:3000/posts/fmtm-etf` in the in-app browser and confirm the paragraphs render in order without horizontal overflow or console errors.
