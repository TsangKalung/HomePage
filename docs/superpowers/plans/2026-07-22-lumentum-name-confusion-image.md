# Lumentum Name Confusion Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert the supplied Lumentum name-confusion screenshot immediately after the article asks why SPMO does not hold Lumentum (LITE).

**Architecture:** Store the JPEG in the existing `public/fmtm-etf/` asset directory and render it through the MDX `Image` component. Preserve the 1181 x 516 aspect ratio and let the screenshot act as a visual punchline before the sourced timing explanation.

**Tech Stack:** Next.js 13, Contentlayer MDX, `next/image`

## Global Constraints

- Insert the image immediately after the paragraph ending in `Lumentum（LITE）？`.
- Keep the following paragraph beginning `答案倒不是 LITE` unchanged.
- Do not add a caption or explanatory bridge paragraph.
- Name the asset `public/fmtm-etf/lumentum-name-confusion.jpg`.
- Preserve the original 1181 x 516 dimensions in MDX.

---

### Task 1: Add the screenshot to the SPMO/LITE passage

**Files:**
- Create: `public/fmtm-etf/lumentum-name-confusion.jpg`
- Modify: `content/posts/fmtm-etf.mdx:41`

**Interfaces:**
- Consumes: the supplied 1181 x 516 JPEG screenshot
- Produces: a public image at `/fmtm-etf/lumentum-name-confusion.jpg`

- [x] **Step 1: Copy the source image into the article asset directory**

Run:

```bash
cp /var/folders/3l/5q65mk_52vz4k1yqhjqylm500000gp/T/codex-clipboard-7378471a-c1f6-49b3-8a91-561272ccd945.jpg public/fmtm-etf/lumentum-name-confusion.jpg
```

Expected: `sips` reports an 1181 x 516 JPEG at the destination.

- [x] **Step 2: Insert the image after the approved question paragraph**

Insert:

```mdx
<Image
  src="/fmtm-etf/lumentum-name-confusion.jpg"
  alt="一段把 Lumentum 与英伟达、美光、微软和英特尔混淆的对话"
  width={1181}
  height={516}
/>
```

Expected: the image reference appears exactly once between the `Lumentum（LITE）？` question and the paragraph beginning `答案倒不是 LITE`.

- [x] **Step 3: Verify the image and live article**

Run:

```bash
pnpm lint
curl -I http://localhost:3000/posts/fmtm-etf
curl -I http://localhost:3000/fmtm-etf/lumentum-name-confusion.jpg
```

Expected: lint reports no warnings or errors; both requests return `200`; the browser renders the image without console errors or horizontal overflow.
