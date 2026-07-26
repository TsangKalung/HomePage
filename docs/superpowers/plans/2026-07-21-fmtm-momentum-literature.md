# FMTM Momentum Literature Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a concise research-backed section showing that momentum is a family of signals and connect that idea cautiously to FMTM's role in a portfolio.

**Architecture:** Modify only the existing FMTM MDX article. Insert one self-contained literature section after the FMTM methodology overview, then add one portfolio-level callback without attributing any paper's findings directly to FMTM's proprietary model.

**Tech Stack:** MDX, Contentlayer, Next.js 13 development server

## Global Constraints

- Do not present the three papers as direct evidence for FMTM's performance.
- Do not claim knowledge of FMTM's proprietary parameters, factor weights, or latent variables.
- State that FMTM has too little history to infer its long-run exposures from realized returns.
- Use cautious language such as “可能” and “提供了合理性”.
- Preserve the article's personal-essay voice instead of turning it into a full literature review.
- Do not run `pnpm build` while the Next.js development server is using `.next`.

---

### Task 1: Integrate the momentum literature argument

**Files:**
- Modify: `content/posts/fmtm-etf.mdx`

**Interfaces:**
- Consumes: The existing FMTM methodology and portfolio-placement sections, plus the three primary-source paper URLs recorded in the design.
- Produces: A valid MDX article with a new `动量不止一种` section and a cautious long/short-horizon momentum allocation argument.

- [x] **Step 1: Confirm the new section is absent**

Run:

```bash
rg -n '^## 动量不止一种$' content/posts/fmtm-etf.mdx
```

Expected: exit 1 with no output, proving the content check fails before the edit.

- [x] **Step 2: Insert the literature section after the FMTM methodology overview**

Add this MDX before `## 全市场动能的诱惑`:

```mdx
## 动量不止一种

不过，讨论 FMTM 之前最好先承认一件事：动量并不是一种东西。

最经典的**截面动量**是在同一时点比较不同股票，买入过去的赢家、卖出过去的输家；**时间序列动量**则让每个资产和自己的历史比较，过去收益为正就偏向做多，为负就偏向做空。期货市场里的**趋势跟随**，通常可以看成时间序列动量的一种实际实现。它们都在追随价格延续，但捕捉的未必是同一种趋势。

[Fang、Hao 与 Wongchoti（2022）](https://www.tandfonline.com/doi/full/10.1080/00036846.2021.1983151)研究个股层面的时间序列动量。他们真正问的不是“动量到底存不存在”，而是“它在什么地方更可能存在”。论文考察了 1986—2017 年超过 2 万只美国个股，发现动量利润在信息传播效率较低的股票和市场状态中更加明显。这个结论提醒我们，动量不是一条在任何股票、任何时期都同样有效的机械规律；市场如何吸收信息，可能和回看期本身一样重要。

[Griffin、Ji 与 Martin（2005）](https://www.pm-research.com/content/iijpormgmt/31/2/23)把视野放到全球股票市场。他们发现价格动量并不是美国特产，盈利预期修正本身也包含增量信息；不同国家、价格信号与盈利信号之间的组合，还可能比单押一种动量获得更好的分散化。这里重要的不是某一个历史收益数字，而是价格趋势与基本面预期变化并不完全是同一条信息通道。

[Baltas 与 Kosowski（2013）](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1968996)研究的则是期货市场和 CTA。他们把趋势跟随拆成日度、周度和月度的时间序列动量，并发现多个频率都能解释 CTA 收益的一部分。换句话说，所谓“趋势”内部也有速度：慢趋势可能来自宏观周期和资金再配置，快趋势则可能来自风险调整、市场冲击或更短期的信息扩散。持有慢、中、快三种信号，不一定等于把同一笔交易重复三遍。

把这三篇论文放在一起看，动量收益更像是一个组合命题：**信号选择 + 资产选择 + 市场状态 + 时间尺度 + 风险与执行管理**。这也是为什么我不太愿意笼统地问“动量是否有效”。更有意义的问题是：你买到的是哪一种动量，它依赖什么市场结构，又会在哪一种反转里失效？

这套研究框架不能直接替 FMTM 背书。FMTM 历史很短，模型又是专有的；如果真想从净值和持仓反推出它的潜在因子与参数，需要更长的数据和潜变量建模，而不是看几个月表现就下结论。它在这里更适合作为一种当代产品样本：基金公司正在把更短周期、更集中、更高频调仓的动量包装成普通投资者可以买到的 ETF。
```

- [x] **Step 3: Add the portfolio-level callback**

Add this paragraph immediately after `## 它应该放在哪里？`:

```mdx
从这个角度看，我想表达的并不是 FMTM 已经证明了自己，而只是：在已有长周期动量暴露的同时，配置一部分较短周期动量，并不是一个毫无根据的想法。如果不同速度的信号捕捉的是不同阶段的价格延续，它们就可能互相分散；当然，遇到突然反转或长期震荡时，它们也完全可能一起失灵。
```

- [x] **Step 4: Verify all required content is present**

Run:

```bash
rg -n '动量不止一种|Fang、Hao|Griffin、Ji|Baltas 与 Kosowski|潜变量建模|不同速度的信号' content/posts/fmtm-etf.mdx
```

Expected: matches for the section heading, all three papers, the proprietary-model caveat, and the portfolio callback.

- [x] **Step 5: Verify the development page compiles and renders**

Run:

```bash
curl -fsS http://localhost:3000/posts/fmtm-etf -o /tmp/fmtm-momentum-literature.html
rg -n '动量不止一种|Fang、Hao|Griffin、Ji|Baltas 与 Kosowski' /tmp/fmtm-momentum-literature.html
if rg -q '__next_error__|Cannot find module|__webpack_modules__' /tmp/fmtm-momentum-literature.html; then exit 1; fi
```

Expected: `curl` exits 0, each new marker appears in the rendered HTML, and the error-marker check exits 0.

- [x] **Step 6: Review the scoped diff**

Run:

```bash
git diff -- content/posts/fmtm-etf.mdx docs/superpowers/plans/2026-07-21-fmtm-momentum-literature.md
git status --short
```

Expected: the article changes are limited to the new literature section and portfolio callback; unrelated user-owned files remain untouched.
