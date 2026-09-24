"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  Check,
  ChevronDown,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  TreasurerChartData,
  getTreasurerChart,
} from "../services/treasurer.service";
import { formatCurrency } from "../utils/format";

type MetricView = "all" | "collections" | "expenses" | "net";

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[190px] rounded-xl border border-slate-700/60 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
      <div className="mb-2 border-b border-slate-800 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label} Breakdown
      </div>
      <div className="space-y-2 text-xs">
        {payload.map((item) => {
          const isNet = item.dataKey === "balance";
          const formattedValue = formatCurrency(item.value);

          return (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 font-medium capitalize">
                  {item.name}
                </span>
              </div>
              <span
                className={`font-black tabular-nums ${
                  isNet
                    ? item.value >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : "text-white"
                }`}
              >
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatYAxisNumber(val: number): string {
  if (val === 0) return "₹0";
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)}K`;
  }
  return `₹${val}`;
}

interface TreasurerFinancialChartProps {
  initialChart?: TreasurerChartData;
  isLoading?: boolean;
}

export function TreasurerFinancialChart({
  initialChart,
  isLoading: propLoading,
}: TreasurerFinancialChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [viewMode, setViewMode] = useState<MetricView>("all");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setYearDropdownOpen(false);
      }
    }
    if (yearDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [yearDropdownOpen]);

  // If a specific year is chosen or initialChart not provided, query the backend treasurer chart endpoint
  const chartQuery = useQuery({
    queryKey: ["treasurer", "chart", selectedYear],
    queryFn: () => getTreasurerChart(selectedYear),
    enabled: selectedYear !== currentYear || !initialChart,
  });

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  // Use backend computed chart data directly
  const chartData: TreasurerChartData = useMemo(() => {
    if (selectedYear === currentYear && initialChart) {
      return initialChart;
    }
    return (
      chartQuery.data ?? {
        year: selectedYear,
        months: [],
        totalCollection: 0,
        totalExpenses: 0,
        netCashflow: 0,
        marginRate: 0,
        hasData: false,
      }
    );
  }, [selectedYear, currentYear, initialChart, chartQuery.data]);

  const isLoading =
    propLoading && selectedYear === currentYear
      ? propLoading
      : chartQuery.isLoading && !initialChart;

  // Dynamic max value for Y-Axis
  const yAxisMax = useMemo(() => {
    const maxVal = Math.max(
      ...chartData.months.flatMap((d) => [
        d.collection,
        d.expenses,
        Math.abs(d.balance),
      ]),
      0
    );
    if (maxVal === 0) return 5000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil(maxVal / magnitude) * magnitude;
  }, [chartData.months]);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      {/* Top Header: Title, Range, & View Toggles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              Cashflow & Collections Overview
            </h2>
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              Live Realized
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time monthly comparison between resident collections, operational expenses, and net surplus.
          </p>
        </div>

        {/* Controls: Year Selector & View Toggles */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Buttons */}
          <div className="flex items-center rounded-xl bg-slate-100/90 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-lg px-2.5 py-1 transition ${
                viewMode === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode("collections")}
              className={`rounded-lg px-2.5 py-1 transition ${
                viewMode === "collections"
                  ? "bg-white text-[#07584F] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Collections
            </button>
            <button
              type="button"
              onClick={() => setViewMode("expenses")}
              className={`rounded-lg px-2.5 py-1 transition ${
                viewMode === "expenses"
                  ? "bg-white text-rose-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setViewMode("net")}
              className={`rounded-lg px-2.5 py-1 transition ${
                viewMode === "net"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Net
            </button>
          </div>

          {/* Year Dropdown */}
          <div className="relative" ref={yearDropdownRef}>
            <button
              type="button"
              onClick={() => setYearDropdownOpen((prev) => !prev)}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Calendar size={13} className="text-slate-400" />
              <span>FY {selectedYear}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {yearDropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in-50 zoom-in-95">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr);
                      setYearDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition cursor-pointer ${
                      selectedYear === yr
                        ? "bg-emerald-50 font-bold text-[#07584F]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>FY {yr}</span>
                    {selectedYear === yr && (
                      <Check size={13} className="text-[#07584F]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="my-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
        {(viewMode === "all" || viewMode === "collections") && (
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#07584F]" />
            <span>Collections (Received)</span>
          </div>
        )}
        {(viewMode === "all" || viewMode === "expenses") && (
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" />
            <span>Expenses (Disbursed)</span>
          </div>
        )}
        {(viewMode === "all" || viewMode === "net") && (
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span>Net Society Cashflow</span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="relative h-[280px] w-full select-none outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-48 w-full animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.months}
                margin={{ top: 12, right: 12, left: -5, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#07584F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#07584F" stopOpacity={0.0} />
                  </linearGradient>

                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>

                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />

                <XAxis
                  dataKey="monthName"
                  tickLine={false}
                  axisLine={{ stroke: "#CBD5E1" }}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                  tickMargin={8}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  tickFormatter={formatYAxisNumber}
                  domain={[0, yAxisMax]}
                  width={48}
                />

                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "4 4" }}
                />

                {(viewMode === "all" || viewMode === "collections") && (
                  <Area
                    type="monotone"
                    dataKey="collection"
                    name="Collection"
                    stroke="#07584F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#collectionGradient)"
                    activeDot={{ r: 5, stroke: "#07584F", strokeWidth: 2, fill: "#fff" }}
                  />
                )}

                {(viewMode === "all" || viewMode === "expenses") && (
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                    activeDot={{ r: 5, stroke: "#F43F5E", strokeWidth: 2, fill: "#fff" }}
                  />
                )}

                {(viewMode === "all" || viewMode === "net") && (
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Net Cashflow"
                    stroke="#2563EB"
                    strokeWidth={2}
                    strokeDasharray={viewMode === "all" ? "3 3" : undefined}
                    fillOpacity={1}
                    fill="url(#netGradient)"
                    activeDot={{ r: 5, stroke: "#2563EB", strokeWidth: 2, fill: "#fff" }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>

            {!chartData.hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-xl pointer-events-none">
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-4 py-2 text-xs font-semibold text-white shadow-md">
                  <Info className="size-4 text-emerald-400 shrink-0" />
                  <span>No payment or expense transactions recorded yet for FY {selectedYear}.</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* YTD Summary Footer Cards — direct from backend chartData */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            FY Collections
          </p>
          <p className="mt-1 text-sm sm:text-base font-black text-slate-900">
            {formatCurrency(chartData.totalCollection)}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            Realized payments
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            FY Expenses
          </p>
          <p className="mt-1 text-sm sm:text-base font-black text-slate-900">
            {formatCurrency(chartData.totalExpenses)}
          </p>
          <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
            Operational payouts
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Net Surplus / Cashflow
          </p>
          <p
            className={`mt-1 text-sm sm:text-base font-black ${
              chartData.netCashflow >= 0 ? "text-blue-700" : "text-rose-700"
            }`}
          >
            {formatCurrency(chartData.netCashflow)}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Treasury balance
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Surplus Margin
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            {chartData.marginRate >= 0 ? (
              <TrendingUp className="size-4 text-emerald-600" />
            ) : (
              <TrendingDown className="size-4 text-rose-600" />
            )}
            <span className="text-sm sm:text-base font-black text-slate-900">
              {chartData.marginRate}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Net cash retained
          </p>
        </div>
      </div>
    </div>
  );
}

export default TreasurerFinancialChart;
