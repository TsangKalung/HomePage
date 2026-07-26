# SPMO and LITE Timing Paragraph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explain immediately after the existing SPMO/LITE question why LITE missed SPMO's March 2026 rebalance and connect the timing mismatch to the trade-off between semiannual and monthly rebalancing.

**Architecture:** Modify only the relevant passage in `content/posts/fmtm-etf.mdx`. Ground the calendar claims in S&P DJI's momentum methodology and March 2026 index announcement, then return to the article's comparison between SPMO and FMTM.

**Tech Stack:** Contentlayer MDX, Next.js 13

## Global Constraints

- Preserve the author's conversational, essay-like tone.
- Insert the explanation immediately after the sentence asking why SPMO does not hold LITE.
- Distinguish the February 27 reference date, March 20 rebalance effective time, and March 23 S&P 500 inclusion date.
- Do not claim LITE was rejected for a weak momentum score; it was outside the eligible S&P 500 universe at the reference date.
- State that September is only LITE's next opportunity for selection, not a guaranteed inclusion.
- Link directly to the official S&P DJI methodology and March 2026 announcement.

---

### Task 1: Add the SPMO/LITE timing explanation

**Files:**
- Modify: `content/posts/fmtm-etf.mdx:41`

**Interfaces:**
- Consumes: S&P Momentum Indices Methodology and S&P DJI's March 6, 2026 constituent announcement
- Produces: a sourced essay passage explaining the eligibility-window mismatch and rebalancing trade-off

- [x] **Step 1: Replace the unfinished SPMO/LITE sentence with the approved passage**

Use the approved structure:

```mdx
这就要牵扯到一个 SPMO 略受诟病的话题：半年是否是个合理的调仓频率？以 SPMO 这轮 3 月的调仓为例，很多人当然会好奇，为什么 SPMO 没有持有峰哥力荐的 LITE？

答案倒不是 LITE 的动量不够强，而是它来得太不巧。按照 [S&P Momentum Indices 方法论](https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-momentum-indices.pdf)，SPMO 跟踪的 S&P 500 Momentum Index 每年在 3 月和 9 月第三个周五收盘后再平衡，但候选池以此前 2 月和 8 月最后一个交易日的 S&P 500 成分股为准。2026 年这两个时间点分别是 2 月 27 日和 3 月 20 日。

LITE 虽然在 3 月 6 日就被宣布将加入 S&P 500，却要到 3 月 23 日开盘前才正式生效。[标普的时间表](https://www.spglobal.com/spdji/en/documents/indexnews/announcements/20260306-1482263/1482263_march2026rebalance1546.pdf)刚好把它安排在 SPMO 调仓后的第一个交易日。换句话说，LITE 拿到 S&P 500 的入场券时，SPMO 这轮选股早已交卷；从 2 月底的参考日看，它甚至没有进入候选池。

这就把半年调仓的代价写得很具体了：LITE 不是被模型淘汰，只是出现在了错误的日历格子里。按照常规安排，它最早要等到 9 月才有下一次入选机会。FMTM 的月度调仓正是对这种迟钝的另一种回答：它未必更聪明，只是更少被日历卡住；当然，代价则是更高的换手和更多被短期噪声反复打脸的机会。
```

Expected: the passage appears once, before `## 为什么是现在？`, with both official source links intact.

- [x] **Step 2: Verify MDX and the live page**

Run:

```bash
pnpm lint
curl -I http://localhost:3000/posts/fmtm-etf
```

Expected: lint reports no warnings or errors; the page returns `200`; the browser shows the new passage without console errors or horizontal overflow.
