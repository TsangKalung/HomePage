# FMTM Top Holdings Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert the supplied July 22, 2026 FMTM top-ten-holdings screenshot immediately after the author's negative first-impression sentence.

**Architecture:** Store the PNG in the existing `public/fmtm-etf/` asset directory and render it with the globally available MDX `Image` component. Preserve the source 1716 x 760 aspect ratio and add descriptive Chinese alternative text.

**Tech Stack:** Next.js 13, Contentlayer MDX, `next/image`

## Global Constraints

- Insert the image immediately after the sentence ending `Holdings 全是一些从没见过的股票代码`.
- Keep the following `## 不同动能策略的时间因子` heading unchanged.
- Do not add a bridge paragraph or update other holdings copy.
- Name the asset `public/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png`.
- Preserve the original 1716 x 760 dimensions in MDX.

---

### Task 1: Add the current top-ten-holdings screenshot

**Files:**
- Create: `public/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png`
- Modify: `content/posts/fmtm-etf.mdx:32`

**Interfaces:**
- Consumes: the supplied 1716 x 760 PNG screenshot
- Produces: a public image at `/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png`

- [x] **Step 1: Copy the source image into the article asset directory**

Run:

```bash
cp /var/folders/3l/5q65mk_52vz4k1yqhjqylm500000gp/T/codex-clipboard-1300804f-48fd-48d0-a904-0286f12ba9b9.png public/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png
```

Expected: `sips` reports a 1716 x 760 PNG at the destination.

- [x] **Step 2: Insert the image after the approved sentence**

Insert:

```mdx
<Image
  src="/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png"
  alt="FMTM 截至 2026 年 7 月 22 日的前十大持仓"
  width={1716}
  height={760}
/>
```

Expected: the image reference appears exactly once between the first-impression sentence and `## 不同动能策略的时间因子`.

- [x] **Step 3: Verify the image and live article**

Run:

```bash
pnpm lint
curl -I http://localhost:3000/posts/fmtm-etf
curl -I http://localhost:3000/fmtm-etf/fmtm-top-10-holdings-2026-07-22.png
```

Expected: lint reports no warnings or errors; both requests return `200`; the browser renders the image without console errors or horizontal overflow.
