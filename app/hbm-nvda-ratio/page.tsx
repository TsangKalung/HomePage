"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type MarketId = "us" | "kr";
type SessionId = "closed" | "pre" | "regular" | "post";
type FetchState = "idle" | "loading" | "success" | "error";
type CompanyId = "nvda" | "mu" | "hynix" | "samsung";

type CompanyConfig = {
  id: CompanyId;
  label: string;
  symbol: string;
  currency: "USD" | "KRW";
  accent: string;
  fallbackSharesOutstandingMillions: number;
};

type CompanySnapshot = {
  id: CompanyId;
  label: string;
  symbol: string;
  accent: string;
  price: number;
  priceCurrency: "USD" | "KRW";
  marketCapUsdMillions: number;
  changePercent: number | null;
};

type RatioSnapshot = {
  updatedAt: number;
  usdKrw: number;
  ratio: number;
  nvdaMarketCapUsdMillions: number;
  hbmMarketCapUsdMillions: number;
  companies: CompanySnapshot[];
};

type MarketState = {
  id: MarketId;
  label: string;
  timezone: string;
  isOpen: boolean;
  session: SessionId;
  sessionLabel: string;
  closesAt: Date | null;
};

type MarketClock = {
  us: MarketState;
  kr: MarketState;
  anyOpen: boolean;
  nextOpenAt: Date | null;
};

type PollPlan = {
  label: string;
  nextAt: number | null;
  isPolling: boolean;
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
};

type YahooProxyResponse = YahooChartResponse & {
  contents?: string;
  status?: {
    http_code?: number;
  };
};

type YahooChartResult = {
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
  };
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
  };
};

type YahooPoint = {
  price: number;
  previousClose: number | null;
};

type ExchangeRateResponse = {
  result?: string;
  rates?: {
    KRW?: number;
  };
};

const HBM_RATIO_ENDPOINT = process.env.NEXT_PUBLIC_HBM_RATIO_ENDPOINT || "";
const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_CORS_PROXY_URL =
  process.env.NEXT_PUBLIC_YAHOO_CORS_PROXY_URL || "https://api.allorigins.win/get?url=";
const USD_KRW_RATE_URL = "https://open.er-api.com/v6/latest/USD";

const POLL_INTERVAL_MS = 10_000;
const HIDDEN_POLL_INTERVAL_MS = 60_000;
const SNAPSHOT_STALE_MS = 2 * 60 * 1000;
const MAX_TIMER_MS = 2_147_000_000;

const STORAGE_KEYS = {
  snapshot: "hbm_ratio_snapshot_v2",
};

const COMPANIES: CompanyConfig[] = [
  {
    id: "nvda",
    label: "NVIDIA",
    symbol: "NVDA",
    currency: "USD",
    accent: "#76b900",
    fallbackSharesOutstandingMillions: 24_300,
  },
  {
    id: "mu",
    label: "Micron",
    symbol: "MU",
    currency: "USD",
    accent: "#ff5a5f",
    fallbackSharesOutstandingMillions: 1_120,
  },
  {
    id: "hynix",
    label: "SK hynix",
    symbol: "000660.KS",
    currency: "KRW",
    accent: "#ff9f1c",
    fallbackSharesOutstandingMillions: 728,
  },
  {
    id: "samsung",
    label: "Samsung Electronics",
    symbol: "005930.KS",
    currency: "KRW",
    accent: "#18b6f6",
    fallbackSharesOutstandingMillions: 5_969.78,
  },
];

const US_FULL_HOLIDAYS_2026 = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
]);

const KRX_FULL_HOLIDAYS_2026 = new Set([
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-02",
  "2026-05-01",
  "2026-05-05",
  "2026-05-25",
  "2026-06-03",
  "2026-08-17",
  "2026-09-24",
  "2026-09-25",
  "2026-10-05",
  "2026-10-09",
  "2026-12-25",
  "2026-12-31",
]);

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedParts(date: Date, timeZone: string) {
  const values: Record<string, number> = {};

  getFormatter(timeZone)
    .formatToParts(date)
    .forEach((part) => {
      if (part.type !== "literal") values[part.type] = Number(part.value);
    });

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function localDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function weekdayFromLocalDate(parts: { year: number; month: number; day: number }) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const actual = getZonedParts(utcGuess, timeZone);
  const expectedMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actualMs = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute,
    actual.second
  );

  return new Date(utcGuess.getTime() + expectedMs - actualMs);
}

function isTradingDate(parts: { year: number; month: number; day: number }, market: MarketId) {
  const weekday = weekdayFromLocalDate(parts);
  const key = localDateKey(parts);

  if (weekday === 0 || weekday === 6) return false;
  return market === "us" ? !US_FULL_HOLIDAYS_2026.has(key) : !KRX_FULL_HOLIDAYS_2026.has(key);
}

function getMarketState(now: Date, market: MarketId): MarketState {
  const timezone = market === "us" ? "America/New_York" : "Asia/Seoul";
  const parts = getZonedParts(now, timezone);
  const minuteOfDay = parts.hour * 60 + parts.minute;
  const tradingDate = isTradingDate(parts, market);

  if (market === "us") {
    const base = { id: "us" as const, label: "US MARKET", timezone };

    if (tradingDate && minuteOfDay >= 4 * 60 && minuteOfDay < 9 * 60 + 30) {
      return {
        ...base,
        isOpen: true,
        session: "pre",
        sessionLabel: "PRE",
        closesAt: zonedTimeToUtc(parts.year, parts.month, parts.day, 9, 30, timezone),
      };
    }

    if (tradingDate && minuteOfDay >= 9 * 60 + 30 && minuteOfDay < 16 * 60) {
      return {
        ...base,
        isOpen: true,
        session: "regular",
        sessionLabel: "REG",
        closesAt: zonedTimeToUtc(parts.year, parts.month, parts.day, 16, 0, timezone),
      };
    }

    if (tradingDate && minuteOfDay >= 16 * 60 && minuteOfDay < 20 * 60) {
      return {
        ...base,
        isOpen: true,
        session: "post",
        sessionLabel: "POST",
        closesAt: zonedTimeToUtc(parts.year, parts.month, parts.day, 20, 0, timezone),
      };
    }

    return { ...base, isOpen: false, session: "closed", sessionLabel: "CLOSED", closesAt: null };
  }

  const base = { id: "kr" as const, label: "KRX MARKET", timezone };

  if (tradingDate && minuteOfDay >= 9 * 60 && minuteOfDay < 15 * 60 + 30) {
    return {
      ...base,
      isOpen: true,
      session: "regular",
      sessionLabel: "REG",
      closesAt: zonedTimeToUtc(parts.year, parts.month, parts.day, 15, 30, timezone),
    };
  }

  return { ...base, isOpen: false, session: "closed", sessionLabel: "CLOSED", closesAt: null };
}

function nextOpenForMarket(now: Date, market: MarketId) {
  const timezone = market === "us" ? "America/New_York" : "Asia/Seoul";
  const nowParts = getZonedParts(now, timezone);
  const openHour = market === "us" ? 4 : 9;

  for (let offset = 0; offset < 12; offset += 1) {
    const localDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day + offset));
    const parts = {
      year: localDate.getUTCFullYear(),
      month: localDate.getUTCMonth() + 1,
      day: localDate.getUTCDate(),
    };

    if (!isTradingDate(parts, market)) continue;

    const openAt = zonedTimeToUtc(parts.year, parts.month, parts.day, openHour, 0, timezone);
    if (openAt.getTime() > now.getTime()) return openAt;
  }

  return null;
}

function getMarketClock(now: Date): MarketClock {
  const us = getMarketState(now, "us");
  const kr = getMarketState(now, "kr");
  const nextUs = nextOpenForMarket(now, "us");
  const nextKr = nextOpenForMarket(now, "kr");
  const nextOpenAt =
    nextUs && nextKr ? new Date(Math.min(nextUs.getTime(), nextKr.getTime())) : nextUs || nextKr;

  return { us, kr, anyOpen: us.isOpen || kr.isOpen, nextOpenAt };
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function yahooChartUrl(symbol: string) {
  const params = new URLSearchParams({
    interval: "1m",
    range: "1d",
    includePrePost: "true",
  });

  return `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}?${params.toString()}`;
}

function proxiedYahooUrl(url: string) {
  return YAHOO_CORS_PROXY_URL ? `${YAHOO_CORS_PROXY_URL}${encodeURIComponent(url)}` : url;
}

function latestYahooPoint(result: YahooChartResult, symbol: string): YahooPoint {
  const closes = result.indicators?.quote?.[0]?.close || [];

  for (let index = closes.length - 1; index >= 0; index -= 1) {
    const close = closes[index];

    if (Number.isFinite(close) && Number(close) > 0) {
      return {
        price: Number(close),
        previousClose: Number.isFinite(result.meta?.chartPreviousClose)
          ? Number(result.meta?.chartPreviousClose)
          : Number.isFinite(result.meta?.previousClose)
          ? Number(result.meta?.previousClose)
          : null,
      };
    }
  }

  if (Number.isFinite(result.meta?.regularMarketPrice) && Number(result.meta?.regularMarketPrice) > 0) {
    return {
      price: Number(result.meta?.regularMarketPrice),
      previousClose: Number.isFinite(result.meta?.chartPreviousClose)
        ? Number(result.meta?.chartPreviousClose)
        : Number.isFinite(result.meta?.previousClose)
        ? Number(result.meta?.previousClose)
        : null,
    };
  }

  throw new Error(`${symbol} returned no live price`);
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);

    const abort = () => {
      window.clearTimeout(timer);
      reject(new Error("Request aborted"));
    };

    if (signal.aborted) abort();
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function fetchYahooPointOnce(symbol: string, signal: AbortSignal) {
  const response = await fetch(proxiedYahooUrl(yahooChartUrl(symbol)), {
    cache: "no-store",
    signal,
  });
  const proxyData = (await response.json()) as YahooProxyResponse;
  const data = proxyData.contents
    ? (JSON.parse(proxyData.contents) as YahooChartResponse)
    : proxyData;
  const proxyStatus = proxyData.status?.http_code;
  const error = data.chart?.error;
  const result = data.chart?.result?.[0];

  if (!response.ok || (proxyStatus && proxyStatus >= 400) || error || !result) {
    throw new Error(error?.description || `Yahoo chart request failed: ${symbol}`);
  }

  return latestYahooPoint(result, symbol);
}

async function fetchYahooPoint(symbol: string, signal: AbortSignal) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchYahooPointOnce(symbol, signal);
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 2) break;
      await sleep(450 * (attempt + 1), signal);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Yahoo chart request failed: ${symbol}`);
}

function changeFromPrevious(point: YahooPoint) {
  if (!point.previousClose || point.previousClose <= 0) return null;
  return ((point.price - point.previousClose) / point.previousClose) * 100;
}

async function fetchUsdKrwRate(signal: AbortSignal) {
  const response = await fetch(USD_KRW_RATE_URL, { cache: "no-store", signal });
  const data = (await response.json()) as ExchangeRateResponse;
  const usdKrw = data.rates?.KRW;

  if (!response.ok || data.result === "error" || !Number.isFinite(usdKrw) || Number(usdKrw) <= 0) {
    throw new Error("USD/KRW rate is unavailable");
  }

  return Number(usdKrw);
}

async function fetchYahooSnapshot(signal: AbortSignal): Promise<RatioSnapshot> {
  const usdKrw = await fetchUsdKrwRate(signal);
  const quoteEntries: Array<readonly [CompanyId, YahooPoint]> = [];

  for (const company of COMPANIES) {
    const quote = await fetchYahooPoint(company.symbol, signal);
    quoteEntries.push([company.id, quote] as const);
  }

  const quotes = Object.fromEntries(quoteEntries) as Record<CompanyId, YahooPoint>;
  const companies = COMPANIES.map((company) => {
    const quote = quotes[company.id];
    const marketCapUsdMillions =
      company.currency === "USD"
        ? quote.price * company.fallbackSharesOutstandingMillions
        : (quote.price * company.fallbackSharesOutstandingMillions) / usdKrw;

    return {
      id: company.id,
      label: company.label,
      symbol: company.symbol,
      accent: company.accent,
      price: quote.price,
      priceCurrency: company.currency,
      marketCapUsdMillions,
      changePercent: changeFromPrevious(quote),
    };
  });

  const nvda = companies.find((company) => company.id === "nvda");
  const hbmMarketCapUsdMillions = companies
    .filter((company) => company.id !== "nvda")
    .reduce((total, company) => total + company.marketCapUsdMillions, 0);

  if (!nvda || nvda.marketCapUsdMillions <= 0) {
    throw new Error("NVIDIA market cap is unavailable");
  }

  return {
    updatedAt: Date.now(),
    usdKrw,
    ratio: hbmMarketCapUsdMillions / nvda.marketCapUsdMillions,
    nvdaMarketCapUsdMillions: nvda.marketCapUsdMillions,
    hbmMarketCapUsdMillions,
    companies,
  };
}

async function fetchEndpointSnapshot(endpoint: string, signal: AbortSignal) {
  const response = await fetch(endpoint, { cache: "no-store", signal });
  const data = (await response.json()) as RatioSnapshot & { error?: string };

  if (!response.ok || data.error || !Number.isFinite(data.ratio)) {
    throw new Error(data.error || `Ratio endpoint failed: ${response.status}`);
  }

  return data;
}

function fetchLiveSnapshot(signal: AbortSignal) {
  return HBM_RATIO_ENDPOINT ? fetchEndpointSnapshot(HBM_RATIO_ENDPOINT, signal) : fetchYahooSnapshot(signal);
}

function formatCompactUsd(millions: number) {
  if (!Number.isFinite(millions)) return "--";
  if (Math.abs(millions) >= 1_000_000) return `$${(millions / 1_000_000).toFixed(2)}T`;
  if (Math.abs(millions) >= 1_000) return `$${(millions / 1_000).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

function formatRatioPercent(value: number | null) {
  if (!Number.isFinite(value)) return "--";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatPrice(value: number, currency: "USD" | "KRW") {
  if (!Number.isFinite(value)) return "--";
  if (currency === "KRW") return `${Math.round(value).toLocaleString()} ₩`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "0.00%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function formatClock(date: Date | null, timeZone: string) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCountdown(target: number | null, now: number) {
  if (!target) return "--";
  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  return `${minutes}:${pad(seconds)}`;
}

function capShare(company: CompanySnapshot, denominator: number) {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.max(0, Math.min(100, (company.marketCapUsdMillions / denominator) * 100));
}

export default function HbmNvdaRatioPage() {
  const [snapshot, setSnapshot] = useState<RatioSnapshot | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [pollPlan, setPollPlan] = useState<PollPlan>({
    label: "IDLE",
    nextAt: null,
    isPolling: false,
  });
  const [refreshNonce, setRefreshNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cachedSnapshot = readJson<RatioSnapshot>(STORAGE_KEYS.snapshot);
    if (cachedSnapshot) setSnapshot(cachedSnapshot);
  }, []);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const marketClock = useMemo(() => (now ? getMarketClock(now) : null), [now]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const clearTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const schedule = () => {
      if (cancelled) return;

      const clock = getMarketClock(new Date());
      const delay = clock.anyOpen
        ? document.hidden
          ? HIDDEN_POLL_INTERVAL_MS
          : POLL_INTERVAL_MS
        : Math.min(
            Math.max(1000, (clock.nextOpenAt?.getTime() || Date.now() + 60_000) - Date.now()),
            MAX_TIMER_MS
          );

      setPollPlan({
        label: clock.anyOpen ? (document.hidden ? "BACKGROUND POLL" : "LIVE POLLING") : "SLEEPING",
        nextAt: Date.now() + delay,
        isPolling: clock.anyOpen,
      });

      clearTimer();
      timer = window.setTimeout(() => {
        void run();
      }, delay);
    };

    const run = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setFetchState("loading");

      try {
        const nextSnapshot = await fetchLiveSnapshot(controller.signal);
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        writeJson(STORAGE_KEYS.snapshot, nextSnapshot);
        setError(null);
        setFetchState("success");
      } catch (nextError) {
        if (cancelled || controller.signal.aborted) return;
        setError(nextError instanceof Error ? nextError.message : "Unknown error");
        setFetchState("error");
      } finally {
        if (!cancelled) schedule();
      }
    };

    const onVisibilityChange = () => {
      clearTimer();
      const cached = readJson<RatioSnapshot>(STORAGE_KEYS.snapshot);
      const age = cached ? Date.now() - cached.updatedAt : Number.POSITIVE_INFINITY;
      const clock = getMarketClock(new Date());

      if (!document.hidden && clock.anyOpen && age > POLL_INTERVAL_MS) {
        void run();
      } else {
        schedule();
      }
    };

    void run();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearTimer();
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshNonce]);

  const displayNow = now?.getTime() || Date.now();
  const isStale = snapshot ? displayNow - snapshot.updatedAt > SNAPSHOT_STALE_MS : false;
  const hbmCompanies = snapshot?.companies.filter((company) => company.id !== "nvda") || [];
  const nvda = snapshot?.companies.find((company) => company.id === "nvda") || null;

  const hbmCapLabel = snapshot ? formatCompactUsd(snapshot.hbmMarketCapUsdMillions) : "--";
  const nvdaCapLabel = snapshot ? formatCompactUsd(snapshot.nvdaMarketCapUsdMillions) : "--";
  const ratioLabel = formatRatioPercent(snapshot?.ratio || null);
  const statusLabel = fetchState === "loading" ? "SYNCING..." : isStale ? "STALE" : "LIVE";
  const visibleCompanies = [nvda, ...hbmCompanies].filter(Boolean) as CompanySnapshot[];
  const ratioNumber = ratioLabel.endsWith("%") ? ratioLabel.slice(0, -1) : ratioLabel;
  const ratioFill = snapshot ? Math.max(2, Math.min(100, snapshot.ratio * 100)) : 0;
  const updatedAtLabel = snapshot ? formatClock(new Date(snapshot.updatedAt), "America/New_York") : "--";

  return (
    <div className="hbm-page">
      <style jsx global>{`
        :root {
          --nvda: #76b900;
          --mu: #ff5a5f;
          --hynix: #ff9f1c;
          --samsung: #18b6f6;
          --ink: #111111;
          --paper: #fbfbf7;
          --yellow: #ffe24a;
          --red: #ff553e;
          --cyan: #16c7d9;
          --pink: #ff70b8;
          --blue: #3b82f6;
          --green: #92d400;
        }

        html,
        body {
          background: var(--ink);
        }

        .hbm-page {
          position: fixed;
          inset: 0;
          z-index: 50;
          overflow-x: hidden;
          overflow-y: auto;
          color: var(--ink);
          background:
            linear-gradient(90deg, rgba(255, 226, 74, 0.18) 0 12px, transparent 12px 46px),
            linear-gradient(0deg, rgba(22, 199, 217, 0.16) 0 10px, transparent 10px 42px),
            var(--ink);
          font-family: var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          letter-spacing: 0;
        }

        .hbm-page *,
        .hbm-page *::before,
        .hbm-page *::after {
          box-sizing: border-box;
        }

        .hbm-page button {
          font: inherit;
        }

        .hbm-shell {
          width: min(1500px, 100%);
          min-height: 100dvh;
          margin: 0 auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .market-header,
        .ratio-stage,
        .formula-board,
        .data-board,
        .company-deck,
        .error-strip,
        .data-ribbon {
          border: 2px solid var(--ink);
          border-radius: 8px;
          box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.9);
          overflow: hidden;
        }

        .market-header {
          min-height: 92px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: stretch;
          gap: 0;
          background: var(--red);
        }

        .title-lockup {
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 2px solid var(--ink);
        }

        .title-lockup span {
          font-size: 0.8rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .title-lockup h1 {
          margin: 0;
          max-width: 900px;
          font-family: var(--font-bodoni), Georgia, serif;
          font-size: 3rem;
          line-height: 0.95;
          font-weight: 900;
        }

        .header-actions {
          min-width: 300px;
          display: grid;
          grid-template-columns: 1fr 76px;
          background: var(--paper);
        }

        .source-panel {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
          border-right: 2px solid var(--ink);
        }

        .status-line,
        .source-line,
        .meta-label,
        .company-symbol,
        .mini-copy,
        .ribbon-item span {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
            "Courier New", monospace;
        }

        .status-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .signal-dot {
          width: 12px;
          height: 12px;
          border: 2px solid var(--ink);
          border-radius: 50%;
          background: var(--green);
        }

        .signal-dot.is-loading {
          background: var(--blue);
          animation: blink 0.8s steps(2, end) infinite;
        }

        .signal-dot.is-stale {
          background: var(--red);
        }

        .source-line {
          display: inline-flex;
          width: fit-content;
          padding: 5px 8px;
          border: 2px solid var(--ink);
          border-radius: 6px;
          background: var(--yellow);
          font-size: 0.72rem;
          font-weight: 900;
        }

        .refresh-button {
          width: 76px;
          border: 0;
          border-left: 0;
          background: var(--cyan);
          color: var(--ink);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease;
        }

        .refresh-button:hover {
          background: var(--pink);
        }

        .refresh-button:active {
          transform: translateY(2px);
        }

        .refresh-button svg {
          width: 28px;
          height: 28px;
          stroke-width: 2.5;
        }

        .refresh-button.is-loading svg {
          animation: spin 0.8s linear infinite;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
          gap: 12px;
          align-items: stretch;
        }

        .ratio-stage {
          min-height: 520px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            linear-gradient(135deg, transparent 0 58%, rgba(255, 85, 62, 0.92) 58% 66%, transparent 66%),
            linear-gradient(90deg, rgba(17, 17, 17, 0.08) 0 2px, transparent 2px 18px),
            var(--yellow);
        }

        .hero-topline {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          font-weight: 900;
          text-transform: uppercase;
        }

        .mini-copy {
          display: block;
          margin-top: 5px;
          font-size: 0.78rem;
          font-weight: 900;
        }

        .ratio-word {
          max-width: 260px;
          text-align: right;
          font-size: 0.92rem;
          line-height: 1.15;
        }

        .ratio-readout {
          margin: 46px 0 26px;
        }

        .ratio-value {
          display: flex;
          align-items: flex-start;
          font-family: var(--font-bodoni), Georgia, serif;
          font-size: 9rem;
          line-height: 0.78;
          font-weight: 900;
        }

        .percent-sign {
          margin-top: 10px;
          font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
          font-size: 2.6rem;
          line-height: 1;
          font-weight: 900;
        }

        .ratio-scale {
          height: 38px;
          border: 2px solid var(--ink);
          border-radius: 6px;
          background: var(--paper);
          overflow: hidden;
        }

        .ratio-scale-fill {
          height: 100%;
          background:
            linear-gradient(90deg, var(--mu), var(--hynix), var(--samsung));
          border-right: 2px solid var(--ink);
          transition: width 500ms ease;
        }

        .aggregate-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .aggregate-grid div {
          padding: 13px 14px;
          border: 2px solid var(--ink);
          border-radius: 6px;
          background: var(--paper);
        }

        .aggregate-grid span,
        .meta-label,
        .tile-label {
          display: block;
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .aggregate-grid strong {
          display: block;
          margin-top: 3px;
          font-size: 1.45rem;
          line-height: 1;
          font-weight: 950;
        }

        .side-column {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 12px;
          min-width: 0;
        }

        .formula-board {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 104px;
          background: var(--paper);
        }

        .formula-left {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-right: 2px solid var(--ink);
        }

        .formula-title {
          margin: 0;
          font-size: 1.15rem;
          line-height: 1.1;
          font-weight: 950;
        }

        .fraction-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .fraction-part {
          min-height: 54px;
          display: grid;
          grid-template-columns: 78px 1fr;
          align-items: center;
          border: 2px solid var(--ink);
          border-radius: 6px;
          overflow: hidden;
        }

        .fraction-part span {
          height: 100%;
          display: grid;
          place-items: center;
          border-right: 2px solid var(--ink);
          background: var(--cyan);
          font-weight: 950;
        }

        .fraction-part strong {
          padding: 10px 12px;
          font-size: 1.1rem;
          line-height: 1.05;
        }

        .fraction-line {
          height: 6px;
          border-radius: 999px;
          background: var(--ink);
        }

        .formula-right {
          display: grid;
          place-items: center;
          background: var(--pink);
          font-size: 2.8rem;
          font-weight: 950;
        }

        .data-board {
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          background: var(--cyan);
        }

        .data-cell {
          min-height: 92px;
          padding: 13px;
          border: 2px solid var(--ink);
          border-radius: 6px;
          background: var(--paper);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .data-value {
          font-size: 1.05rem;
          line-height: 1.1;
          font-weight: 950;
          word-break: break-word;
        }

        .data-value.small {
          font-size: 0.92rem;
        }

        .company-deck {
          padding: 14px;
          background: var(--green);
        }

        .deck-header {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .deck-header h2 {
          margin: 0;
          font-family: var(--font-bodoni), Georgia, serif;
          font-size: 2.05rem;
          line-height: 0.95;
          font-weight: 900;
        }

        .company-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .company-tile {
          min-height: 208px;
          display: flex;
          flex-direction: column;
          border: 2px solid var(--ink);
          border-radius: 8px;
          background: var(--paper);
          overflow: hidden;
        }

        .tile-color {
          height: 18px;
          border-bottom: 2px solid var(--ink);
        }

        .tile-body {
          min-width: 0;
          flex: 1;
          padding: 13px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
        }

        .company-symbol {
          display: inline-flex;
          width: fit-content;
          margin-top: 6px;
          padding: 4px 7px;
          border: 2px solid var(--ink);
          border-radius: 6px;
          background: var(--yellow);
          font-size: 0.72rem;
          font-weight: 900;
        }

        .company-name {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.04;
          font-weight: 950;
        }

        .cap-value {
          font-size: 1.65rem;
          line-height: 1;
          font-weight: 950;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .change-up {
          color: #087a22;
        }

        .change-down {
          color: #c42222;
        }

        .tile-meter {
          height: 13px;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: #ffffff;
          overflow: hidden;
        }

        .tile-meter span {
          display: block;
          height: 100%;
          transition: width 500ms ease;
        }

        .error-strip {
          padding: 13px 16px;
          background: var(--red);
          font-weight: 900;
        }

        .data-ribbon {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          background: var(--paper);
        }

        .ribbon-item {
          padding: 11px 14px;
          border-right: 2px solid var(--ink);
        }

        .ribbon-item:last-child {
          border-right: 0;
        }

        .ribbon-item span {
          display: block;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ribbon-item strong {
          display: block;
          margin-top: 3px;
          font-size: 0.95rem;
          line-height: 1.15;
          font-weight: 950;
        }

        @keyframes blink {
          50% {
            opacity: 0.35;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1180px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .side-column {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
          }

          .company-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .hbm-shell {
            padding: 10px;
          }

          .market-header {
            grid-template-columns: 1fr;
          }

          .title-lockup {
            border-right: 0;
            border-bottom: 2px solid var(--ink);
          }

          .title-lockup h1 {
            font-size: 2.15rem;
          }

          .header-actions {
            min-width: 0;
          }

          .main-grid,
          .side-column,
          .company-grid,
          .data-ribbon {
            grid-template-columns: 1fr;
          }

          .ratio-stage {
            min-height: 430px;
            padding: 18px;
          }

          .hero-topline {
            flex-direction: column;
          }

          .ratio-word {
            max-width: none;
            text-align: left;
          }

          .ratio-readout {
            margin: 36px 0 22px;
          }

          .ratio-value {
            font-size: 5.1rem;
          }

          .percent-sign {
            font-size: 1.75rem;
          }

          .aggregate-grid,
          .data-board,
          .formula-board {
            grid-template-columns: 1fr;
          }

          .formula-left {
            border-right: 0;
            border-bottom: 2px solid var(--ink);
          }

          .formula-right {
            min-height: 78px;
          }

          .ribbon-item {
            border-right: 0;
            border-bottom: 2px solid var(--ink);
          }

          .ribbon-item:last-child {
            border-bottom: 0;
          }
        }

        @media (max-width: 420px) {
          .title-lockup h1 {
            font-size: 1.8rem;
          }

          .ratio-value {
            font-size: 4.2rem;
          }

          .aggregate-grid strong,
          .cap-value {
            font-size: 1.32rem;
          }

          .fraction-part {
            grid-template-columns: 62px 1fr;
          }
        }
      `}</style>

      <div className="hbm-shell">
        <header className="market-header">
          <div className="title-lockup">
            <span>HBM / NVDA bubble gauge</span>
            <h1>When does the HBM bubble burst?</h1>
          </div>

          <div className="header-actions">
            <div className="source-panel">
              <div className="status-line">
                <span
                  className={`signal-dot ${fetchState === "loading" ? "is-loading" : ""} ${
                    isStale ? "is-stale" : ""
                  }`}
                />
                {statusLabel}
              </div>
              <div className="source-line">{HBM_RATIO_ENDPOINT ? "DIRECT ENDPOINT" : "YAHOO PROXY"}</div>
            </div>

            <button
              aria-label="Refresh HBM to NVIDIA ratio"
              title="Refresh"
              className={`refresh-button ${fetchState === "loading" ? "is-loading" : ""}`}
              onClick={() => setRefreshNonce((nonce) => nonce + 1)}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v6h6M20 20v-6h-6M6.5 17.5A7.8 7.8 0 0 0 20 12M17.5 6.5A7.8 7.8 0 0 0 4 12"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="main-grid">
          <motion.section
            className="ratio-stage"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="hero-topline">
              <div>
                <span className="meta-label">Current ratio</span>
                <span className="mini-copy">MU + SK hynix + Samsung / NVDA</span>
              </div>
              <div className="ratio-word">Supplier valuations keep leaning on one NVIDIA denominator.</div>
            </div>

            <motion.div
              key={ratioLabel}
              className="ratio-readout"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <div className="ratio-value">
                {ratioNumber}
                <span className="percent-sign">%</span>
              </div>
            </motion.div>

            <div>
              <div className="ratio-scale" aria-label={`HBM companies are ${ratioLabel} of NVIDIA market cap`}>
                <div className="ratio-scale-fill" style={{ width: `${ratioFill}%` }} />
              </div>

              <div className="aggregate-grid">
                <div>
                  <span>HBM aggregate</span>
                  <strong>{hbmCapLabel}</strong>
                </div>
                <div>
                  <span>NVIDIA base</span>
                  <strong>{nvdaCapLabel}</strong>
                </div>
              </div>
            </div>
          </motion.section>

          <aside className="side-column">
            <section className="formula-board">
              <div className="formula-left">
                <h2 className="formula-title">Bubble pressure: supplier cap over NVIDIA cap.</h2>
                <div className="fraction-row">
                  <div className="fraction-part">
                    <span>TOP</span>
                    <strong>{hbmCapLabel} from Micron, SK hynix, Samsung</strong>
                  </div>
                  <div className="fraction-line" />
                  <div className="fraction-part">
                    <span>BASE</span>
                    <strong>{nvdaCapLabel} from NVIDIA</strong>
                  </div>
                </div>
              </div>
              <div className="formula-right">%</div>
            </section>

            <section className="data-board">
              <div className="data-cell">
                <span className="meta-label">Updated</span>
                <strong className="data-value small">{updatedAtLabel}</strong>
              </div>
              <div className="data-cell">
                <span className="meta-label">Next tick</span>
                <strong className="data-value">{formatCountdown(pollPlan.nextAt, displayNow)}</strong>
              </div>
              <div className="data-cell">
                <span className="meta-label">Poll mode</span>
                <strong className="data-value small">{pollPlan.label}</strong>
              </div>
              <div className="data-cell">
                <span className="meta-label">USD/KRW</span>
                <strong className="data-value">{snapshot?.usdKrw.toFixed(2) || "--"}</strong>
              </div>
            </section>
          </aside>
        </main>

        <section className="company-deck">
          <div className="deck-header">
            <h2>Bubble constituents</h2>
            <span className="mini-copy">{pollPlan.isPolling ? "open-market polling" : "waiting for next open"}</span>
          </div>

          <div className="company-grid">
            {visibleCompanies.map((company, index) => {
              const isNvda = company.id === "nvda";
              const meterDenominator = isNvda
                ? snapshot?.nvdaMarketCapUsdMillions || 1
                : snapshot?.hbmMarketCapUsdMillions || 1;
              const meterWidth = isNvda ? 100 : capShare(company, meterDenominator);

              return (
                <motion.article
                  key={company.id}
                  className="company-tile"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="tile-color" style={{ backgroundColor: company.accent }} />
                  <div className="tile-body">
                    <div>
                      <span className="tile-label">{isNvda ? "Denominator" : "Numerator"}</span>
                      <h3 className="company-name">{company.label}</h3>
                      <span className="company-symbol">{company.symbol}</span>
                    </div>

                    <div>
                      <div className="cap-value">{formatCompactUsd(company.marketCapUsdMillions)}</div>
                      <div className="price-row">
                        <span>{formatPrice(company.price, company.priceCurrency)}</span>
                        <span className={Number(company.changePercent) >= 0 ? "change-up" : "change-down"}>
                          {formatPercent(company.changePercent)}
                        </span>
                      </div>
                    </div>

                    <div className="tile-meter" aria-hidden="true">
                      <span style={{ width: `${meterWidth}%`, backgroundColor: company.accent }} />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {error && <div className="error-strip">{error}</div>}

        <footer className="data-ribbon">
          <div className="ribbon-item">
            <span>US market</span>
            <strong>
              {marketClock?.us.sessionLabel || "--"} ·{" "}
              {marketClock?.us.closesAt ? formatClock(marketClock.us.closesAt, marketClock.us.timezone) : "--"}
            </strong>
          </div>
          <div className="ribbon-item">
            <span>KRX market</span>
            <strong>
              {marketClock?.kr.sessionLabel || "--"} ·{" "}
              {marketClock?.kr.closesAt ? formatClock(marketClock.kr.closesAt, marketClock.kr.timezone) : "--"}
            </strong>
          </div>
          <div className="ribbon-item">
            <span>Next open</span>
            <strong>{marketClock?.nextOpenAt ? formatClock(marketClock.nextOpenAt, "Asia/Shanghai") : "--"}</strong>
          </div>
          <div className="ribbon-item">
            <span>Ratio</span>
            <strong>{ratioLabel}</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}
