# FMTM Comparison Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert the supplied momentum ETF comparison table immediately after the monthly rebalancing step in the FMTM article.

**Architecture:** Store the source PNG under the existing `public/fmtm-etf/` article asset directory and render it through the globally available MDX `Image` component. Preserve the source image's 1800 x 814 aspect ratio and add descriptive Chinese alternative text.

**Tech Stack:** Next.js 13, Contentlayer MDX, `next/image`

## Global Constraints

- Insert the image immediately after `4. **每个月**都按上述步骤重新调仓和再平衡（这个惊人的频率很重要，后面会展开聊聊）`.
- Keep unrelated article copy unchanged.
- Name the asset descriptively under `public/fmtm-etf/`.
- Preserve the original 1800 x 814 dimensions in the MDX image declaration.

---

### Task 1: Add the comparison table to the article

**Files:**
- Create: `public/fmtm-etf/fmtm-momentum-etf-comparison.png`
- Modify: `content/posts/fmtm-etf.mdx:28`

**Interfaces:**
- Consumes: the supplied 1800 x 814 PNG screenshot
- Produces: a public image at `/fmtm-etf/fmtm-momentum-etf-comparison.png`

- [x] **Step 1: Copy the source image into the article asset directory**

Run:

```bash
cp '/var/folders/3l/5q65mk_52vz4k1yqhjqylm500000gp/T/TemporaryItems/NSIRD_screencaptureui_k1zsdZ/截屏2026-07-21 23.24.53.png' public/fmtm-etf/fmtm-momentum-etf-comparison.png
```

Expected: `sips` reports a 1800 x 814 PNG at the destination.

- [x] **Step 2: Add the MDX image immediately after the monthly rebalancing step**

Insert:

```mdx
<Image
  src="/fmtm-etf/fmtm-momentum-etf-comparison.png"
  alt="FMTM 与 SPMO、MTUM 等美国动能 ETF 的策略特征对比"
  width={1800}
  height={814}
/>
```

Expected: the source contains exactly one reference to the new image, after the specified sentence.

- [x] **Step 3: Verify the content and live page**

Run:

```bash
pnpm lint
curl -I http://localhost:3000/posts/fmtm-etf
curl -I http://localhost:3000/fmtm-etf/fmtm-momentum-etf-comparison.png
```

Expected: lint reports no warnings or errors; both HTTP requests return `200`; the browser renders the image without horizontal page overflow.
