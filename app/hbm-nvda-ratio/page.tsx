"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type MarketId = "us" | "kr";
type SessionId = "closed" | "pre" | "regular" | "post";
type FetchState = "idle" | "loading" | "success" | "error";
type CompanyId = "nvda" | "mu" | "hynix" | "samsung";
type MarketDataSource = "endpoint" | "stockdata" | "finnhub" | "public";

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
  dataSource?: MarketDataSource;
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

type FlipValueProps = {
  value: string;
  numericValue?: number | null;
  className?: string;
  animate?: boolean;
};

type QuotePoint = {
  price: number;
  previousClose: number | null;
  changePercent: number | null;
};

type FinnhubQuoteResponse = {
  c?: number;
  pc?: number;
  dp?: number;
  error?: string;
};

type FinnhubForexRatesResponse = {
  quote?: {
    KRW?: number;
  };
  error?: string;
};

type TerminalFeedStocksResponse = {
  data?: Array<{
    symbol?: string;
    price?: number;
    change_percent?: number;
    prev_close?: number;
  }>;
};

type StockDataQuoteResponse = {
  data?: Array<{
    ticker?: string;
    price?: number;
    previous_close_price?: number;
    day_change?: number;
    is_extended_hours_price?: boolean;
    last_trade_time?: string;
  }>;
};

type KoreaStocksResponse = {
  success?: boolean;
  data?: Array<{
    code?: string;
    currentPrice?: number;
    changeRate?: number;
    isDelisted?: boolean;
  }>;
};

type ExchangeRateResponse = {
  result?: string;
  rates?: {
    KRW?: number;
  };
};

const HBM_RATIO_ENDPOINT = process.env.NEXT_PUBLIC_HBM_RATIO_ENDPOINT || "";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";
const STOCKDATA_API_TOKEN = process.env.NEXT_PUBLIC_STOCKDATA_API_TOKEN || "";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const TERMINALFEED_STOCKS_URL = "https://terminalfeed.io/api/stocks?symbols=NVDA,MU";
const STOCKDATA_QUOTES_URL = "https://api.stockdata.org/v1/data/quote";
const KOREA_STOCKS_URL = "https://stock.total-hts.com/api/stocks?codes=005930,000660";
const USD_KRW_RATE_URL = "https://open.er-api.com/v6/latest/USD";

const POLL_INTERVAL_MS = 15_000;
const HIDDEN_POLL_INTERVAL_MS = 60_000;
const SNAPSHOT_STALE_MS = 2 * 60 * 1000;
const NO_CACHE_PARAM = "_hbm_no_cache";

let noCacheRequestId = 0;

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

async function retry<T>(operation: () => Promise<T>, signal: AbortSignal, message: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 2) break;
      await sleep(450 * (attempt + 1), signal);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(message);
}

function finnhubUrl(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    ...params,
    token: FINNHUB_API_KEY,
  });

  return `${FINNHUB_BASE_URL}${path}?${searchParams.toString()}`;
}

function withNoCacheParam(input: string) {
  const nonce = `${Date.now()}-${noCacheRequestId}`;
  noCacheRequestId += 1;

  try {
    const base = typeof window === "undefined" ? "https://hbm-ratio.local" : window.location.href;
    const url = new URL(input, base);
    url.searchParams.set(NO_CACHE_PARAM, nonce);
    return /^[a-z][a-z\d+\-.]*:/i.test(input)
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const hashIndex = input.indexOf("#");
    const path = hashIndex === -1 ? input : input.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : input.slice(hashIndex);
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}${NO_CACHE_PARAM}=${encodeURIComponent(nonce)}${hash}`;
  }
}

function fetchNoCache(input: string, signal: AbortSignal) {
  return fetch(withNoCacheParam(input), {
    cache: "no-store",
    signal,
  });
}

async function readJsonResponse<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Market data request returned HTTP ${response.status}`);
  }
}

function requireFinnhubApiKey() {
  if (!FINNHUB_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_FINNHUB_API_KEY for live Finnhub market data");
  }
}

async function fetchFinnhubQuoteOnce(symbol: string, signal: AbortSignal): Promise<QuotePoint> {
  requireFinnhubApiKey();

  const response = await fetchNoCache(finnhubUrl("/quote", { symbol }), signal);
  const data = await readJsonResponse<FinnhubQuoteResponse>(response);
  const price = Number(data.c);
  const previousClose = Number(data.pc);
  const changePercent = Number(data.dp);

  if (!response.ok || data.error) {
    throw new Error(data.error || `Finnhub quote request failed: ${symbol}`);
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${symbol} returned no live price`);
  }

  return {
    price,
    previousClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
    changePercent: Number.isFinite(changePercent) ? changePercent : null,
  };
}

function fetchFinnhubQuote(symbol: string, signal: AbortSignal) {
  return retry(
    () => fetchFinnhubQuoteOnce(symbol, signal),
    signal,
    `Finnhub quote request failed: ${symbol}`
  );
}

function changeFromPrevious(point: QuotePoint) {
  if (!point.previousClose || point.previousClose <= 0) return null;
  return ((point.price - point.previousClose) / point.previousClose) * 100;
}

function isUsExtendedHours(date = new Date()) {
  const session = getMarketState(date, "us").session;
  return session === "pre" || session === "post";
}

async function fetchUsdKrwRateOnce(signal: AbortSignal) {
  const response = await fetchNoCache(USD_KRW_RATE_URL, signal);
  const data = await readJsonResponse<ExchangeRateResponse>(response);
  const usdKrw = data.rates?.KRW;

  if (!response.ok || data.result === "error" || !Number.isFinite(usdKrw) || Number(usdKrw) <= 0) {
    throw new Error("USD/KRW rate is unavailable");
  }

  return Number(usdKrw);
}

function fetchUsdKrwRate(signal: AbortSignal) {
  return retry(() => fetchUsdKrwRateOnce(signal), signal, "USD/KRW rate is unavailable");
}

async function fetchTerminalFeedUsQuotesOnce(signal: AbortSignal) {
  const response = await fetchNoCache(TERMINALFEED_STOCKS_URL, signal);
  const data = await readJsonResponse<TerminalFeedStocksResponse>(response);

  if (!response.ok || !Array.isArray(data.data)) {
    throw new Error("TerminalFeed US stock data is unavailable");
  }

  const quotes = new Map<CompanyId, QuotePoint>();

  data.data.forEach((entry) => {
    const id = entry.symbol === "NVDA" ? "nvda" : entry.symbol === "MU" ? "mu" : null;
    const price = Number(entry.price);
    const previousClose = Number(entry.prev_close);
    const changePercent = Number(entry.change_percent);

    if (!id || !Number.isFinite(price) || price <= 0) return;

    quotes.set(id, {
      price,
      previousClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
      changePercent: Number.isFinite(changePercent) ? changePercent : null,
    });
  });

  if (!quotes.has("nvda") || !quotes.has("mu")) {
    throw new Error("TerminalFeed did not return NVDA and MU quotes");
  }

  return quotes;
}

function fetchTerminalFeedUsQuotes(signal: AbortSignal) {
  return retry(
    () => fetchTerminalFeedUsQuotesOnce(signal),
    signal,
    "TerminalFeed US stock data is unavailable"
  );
}

function stockDataQuoteUrl() {
  const searchParams = new URLSearchParams({
    symbols: "NVDA,MU",
    extended_hours: "true",
    api_token: STOCKDATA_API_TOKEN,
  });

  return `${STOCKDATA_QUOTES_URL}?${searchParams.toString()}`;
}

async function fetchStockDataUsQuotesOnce(signal: AbortSignal) {
  if (!STOCKDATA_API_TOKEN) {
    throw new Error("Missing NEXT_PUBLIC_STOCKDATA_API_TOKEN for extended-hours US quotes");
  }

  const response = await fetchNoCache(stockDataQuoteUrl(), signal);
  const data = await readJsonResponse<StockDataQuoteResponse & { message?: string; error?: string }>(response);

  if (!response.ok || !Array.isArray(data.data)) {
    throw new Error(data.error || data.message || "StockData US stock data is unavailable");
  }

  const quotes = new Map<CompanyId, QuotePoint>();

  data.data.forEach((entry) => {
    const id = entry.ticker === "NVDA" ? "nvda" : entry.ticker === "MU" ? "mu" : null;
    const price = Number(entry.price);
    const previousClose = Number(entry.previous_close_price);
    const changePercent = Number(entry.day_change);

    if (!id || !Number.isFinite(price) || price <= 0) return;

    quotes.set(id, {
      price,
      previousClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
      changePercent: Number.isFinite(changePercent) ? changePercent : null,
    });
  });

  if (!quotes.has("nvda") || !quotes.has("mu")) {
    throw new Error("StockData did not return NVDA and MU quotes");
  }

  return quotes;
}

function fetchStockDataUsQuotes(signal: AbortSignal) {
  return retry(
    () => fetchStockDataUsQuotesOnce(signal),
    signal,
    "StockData US stock data is unavailable"
  );
}

async function fetchKoreaQuotesOnce(signal: AbortSignal) {
  const response = await fetchNoCache(KOREA_STOCKS_URL, signal);
  const data = await readJsonResponse<KoreaStocksResponse>(response);

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new Error("Korean stock data is unavailable");
  }

  const quotes = new Map<CompanyId, QuotePoint>();

  data.data.forEach((entry) => {
    const id = entry.code === "000660" ? "hynix" : entry.code === "005930" ? "samsung" : null;
    const price = Number(entry.currentPrice);
    const changePercent = Number(entry.changeRate);

    if (!id || entry.isDelisted || !Number.isFinite(price) || price <= 0) return;

    quotes.set(id, {
      price,
      previousClose: null,
      changePercent: Number.isFinite(changePercent) ? changePercent : null,
    });
  });

  if (!quotes.has("hynix") || !quotes.has("samsung")) {
    throw new Error("Korean stock data did not return SK hynix and Samsung");
  }

  return quotes;
}

function fetchKoreaQuotes(signal: AbortSignal) {
  return retry(() => fetchKoreaQuotesOnce(signal), signal, "Korean stock data is unavailable");
}

async function fetchPublicSnapshot(signal: AbortSignal): Promise<RatioSnapshot> {
  const usdKrwPromise = fetchUsdKrwRate(signal);
  const koreaQuotesPromise = fetchKoreaQuotes(signal);
  let usQuotes: Map<CompanyId, QuotePoint>;
  let dataSource: MarketDataSource = "public";

  if (STOCKDATA_API_TOKEN) {
    try {
      usQuotes = await fetchStockDataUsQuotes(signal);
      dataSource = "stockdata";
    } catch (error) {
      if (signal.aborted) throw error;
      usQuotes = await fetchTerminalFeedUsQuotes(signal);
    }
  } else {
    usQuotes = await fetchTerminalFeedUsQuotes(signal);
  }

  const [usdKrw, koreaQuotes] = await Promise.all([usdKrwPromise, koreaQuotesPromise]);
  const quotes = Object.fromEntries([
    ...Array.from(usQuotes.entries()),
    ...Array.from(koreaQuotes.entries()),
  ]) as Record<CompanyId, QuotePoint>;

  return buildSnapshot(quotes, usdKrw, dataSource);
}

async function fetchFinnhubUsdKrwRateOnce(signal: AbortSignal) {
  requireFinnhubApiKey();

  const response = await fetchNoCache(finnhubUrl("/forex/rates", { base: "USD" }), signal);
  const data = await readJsonResponse<FinnhubForexRatesResponse>(response);
  const usdKrw = data.quote?.KRW;

  if (!response.ok || data.error || !Number.isFinite(usdKrw) || Number(usdKrw) <= 0) {
    throw new Error(data.error || "Finnhub USD/KRW rate is unavailable");
  }

  return Number(usdKrw);
}

function fetchFinnhubUsdKrwRate(signal: AbortSignal) {
  return retry(() => fetchFinnhubUsdKrwRateOnce(signal), signal, "Finnhub USD/KRW rate is unavailable");
}

async function fetchFinnhubSnapshot(signal: AbortSignal): Promise<RatioSnapshot> {
  const [usdKrw, quoteEntries] = await Promise.all([
    fetchFinnhubUsdKrwRate(signal),
    Promise.all(
      COMPANIES.map(async (company) => {
        const quote = await fetchFinnhubQuote(company.symbol, signal);
        return [company.id, quote] as const;
      })
    ),
  ]);

  const quotes = Object.fromEntries(quoteEntries) as Record<CompanyId, QuotePoint>;
  return buildSnapshot(quotes, usdKrw, "finnhub");
}

function buildSnapshot(
  quotes: Record<CompanyId, QuotePoint>,
  usdKrw: number,
  dataSource: MarketDataSource
): RatioSnapshot {
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
      changePercent: quote.changePercent ?? changeFromPrevious(quote),
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
    dataSource,
    usdKrw,
    ratio: hbmMarketCapUsdMillions / nvda.marketCapUsdMillions,
    nvdaMarketCapUsdMillions: nvda.marketCapUsdMillions,
    hbmMarketCapUsdMillions,
    companies,
  };
}

async function fetchEndpointSnapshot(endpoint: string, signal: AbortSignal) {
  const response = await fetchNoCache(endpoint, signal);
  const data = (await response.json()) as RatioSnapshot & { error?: string };

  if (!response.ok || data.error || !Number.isFinite(data.ratio)) {
    throw new Error(data.error || `Ratio endpoint failed: ${response.status}`);
  }

  return { ...data, dataSource: data.dataSource || "endpoint" };
}

function fetchLiveSnapshot(signal: AbortSignal) {
  if (HBM_RATIO_ENDPOINT) return fetchEndpointSnapshot(HBM_RATIO_ENDPOINT, signal);
  if (STOCKDATA_API_TOKEN) return fetchPublicSnapshot(signal);
  if (FINNHUB_API_KEY) return fetchFinnhubSnapshot(signal);
  return fetchPublicSnapshot(signal);
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

function FlipValue({ value, numericValue, className, animate = true }: FlipValueProps) {
  const previous = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const comparableValue = Number.isFinite(numericValue) ? Number(numericValue) : null;
  const previousValue = previous.current;
  const direction =
    comparableValue !== null && previousValue !== null && comparableValue !== previousValue
      ? comparableValue > previousValue
        ? 1
        : -1
      : 0;

  useEffect(() => {
    previous.current = comparableValue;
  }, [comparableValue]);

  if (reducedMotion || !animate) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={`flip-value ${className || ""}`}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          initial={(nextDirection: number) => ({
            y: nextDirection === 0 ? 0 : nextDirection > 0 ? "100%" : "-100%",
            opacity: nextDirection === 0 ? 1 : 0,
          })}
          animate={{ y: 0, opacity: 1 }}
          exit={(nextDirection: number) => ({
            y: nextDirection === 0 ? 0 : nextDirection > 0 ? "-100%" : "100%",
            opacity: nextDirection === 0 ? 1 : 0,
          })}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
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
  const requestIdRef = useRef(0);

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

      const delay = document.hidden ? HIDDEN_POLL_INTERVAL_MS : POLL_INTERVAL_MS;

      setPollPlan({
        label: document.hidden ? "BACKGROUND POLL" : "15S LIVE POLL",
        nextAt: Date.now() + delay,
        isPolling: true,
      });

      clearTimer();
      timer = window.setTimeout(() => {
        void run();
      }, delay);
    };

    const run = async () => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      const controller = new AbortController();
      setFetchState("loading");

      try {
        const nextSnapshot = await fetchLiveSnapshot(controller.signal);
        if (cancelled || requestId !== requestIdRef.current) return;
        setSnapshot(nextSnapshot);
        setError(null);
        setFetchState("success");
      } catch (nextError) {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(nextError instanceof Error ? nextError.message : "Unknown error");
        setFetchState("error");
      } finally {
        if (!cancelled && requestId === requestIdRef.current) schedule();
      }
    };

    const onVisibilityChange = () => {
      clearTimer();

      if (!document.hidden) {
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
      requestIdRef.current += 1;
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
  const activeDataSource: MarketDataSource =
    snapshot?.dataSource ||
    (HBM_RATIO_ENDPOINT
      ? "endpoint"
      : STOCKDATA_API_TOKEN
      ? "stockdata"
      : FINNHUB_API_KEY
      ? "finnhub"
      : "public");
  const usesPublicRegularUsQuote = activeDataSource === "public" && isUsExtendedHours();
  const statusLabel =
    fetchState === "loading"
      ? "SYNCING..."
      : fetchState === "error"
      ? "ERROR"
      : isStale
      ? "STALE"
      : usesPublicRegularUsQuote
      ? "DELAYED"
      : "LIVE";
  const visibleCompanies = [nvda, ...hbmCompanies].filter(Boolean) as CompanySnapshot[];
  const ratioNumber = ratioLabel.endsWith("%") ? ratioLabel.slice(0, -1) : ratioLabel;
  const ratioFill = snapshot ? Math.max(2, Math.min(100, snapshot.ratio * 100)) : 0;
  const updatedAtLabel = snapshot ? formatClock(new Date(snapshot.updatedAt), "America/New_York") : "--";
  const dataSourceLabel = activeDataSource === "endpoint"
    ? "DIRECT ENDPOINT"
    : activeDataSource === "stockdata"
    ? "STOCKDATA EXT"
    : activeDataSource === "finnhub"
    ? "FINNHUB LIVE"
    : usesPublicRegularUsQuote
    ? "PUBLIC CLOSE"
    : "PUBLIC DATA";

  return (
    <div className="hbm-page">
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
                    fetchState === "error" || isStale ? "is-stale" : ""
                  }`}
                />
                {statusLabel}
              </div>
              <div className="source-line">{dataSourceLabel}</div>
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
            initial={false}
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
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <div className="ratio-value">
                <FlipValue value={ratioNumber} numericValue={snapshot?.ratio ?? null} />
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
                  <strong>
                    <FlipValue
                      value={hbmCapLabel}
                      numericValue={snapshot?.hbmMarketCapUsdMillions ?? null}
                    />
                  </strong>
                </div>
                <div>
                  <span>NVIDIA base</span>
                  <strong>
                    <FlipValue
                      value={nvdaCapLabel}
                      numericValue={snapshot?.nvdaMarketCapUsdMillions ?? null}
                    />
                  </strong>
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
                    <strong>
                      <FlipValue
                        value={hbmCapLabel}
                        numericValue={snapshot?.hbmMarketCapUsdMillions ?? null}
                      />{" "}
                      from Micron, SK hynix, Samsung
                    </strong>
                  </div>
                  <div className="fraction-line" />
                  <div className="fraction-part">
                    <span>BASE</span>
                    <strong>
                      <FlipValue
                        value={nvdaCapLabel}
                        numericValue={snapshot?.nvdaMarketCapUsdMillions ?? null}
                      />{" "}
                      from NVIDIA
                    </strong>
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
                <strong className="data-value">
                  <FlipValue value={snapshot?.usdKrw.toFixed(2) || "--"} numericValue={snapshot?.usdKrw ?? null} />
                </strong>
              </div>
            </section>
          </aside>
        </main>

        <section className="company-deck">
          <div className="deck-header">
            <h2>Bubble constituents</h2>
            <span className="mini-copy">{pollPlan.isPolling ? "15-second refresh" : "polling paused"}</span>
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
                      <div className="cap-value">
                        <FlipValue
                          value={formatCompactUsd(company.marketCapUsdMillions)}
                          numericValue={company.marketCapUsdMillions}
                          animate={false}
                        />
                      </div>
                      <div className="price-row">
                        <span>
                          <FlipValue
                            value={formatPrice(company.price, company.priceCurrency)}
                            numericValue={company.price}
                            animate={false}
                          />
                        </span>
                        <span className={Number(company.changePercent) >= 0 ? "change-up" : "change-down"}>
                          <FlipValue
                            value={formatPercent(company.changePercent)}
                            numericValue={company.changePercent}
                            animate={false}
                          />
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
            <strong>
              <FlipValue value={ratioLabel} numericValue={snapshot?.ratio ?? null} />
            </strong>
          </div>
        </footer>
      </div>
    </div>
  );
}
