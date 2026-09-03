"use client";

import { useQuery } from "@tanstack/react-query";

import { getMonthlyFinance } from "../services/treasurer.service";
import {
  formatCurrency,
  monthLabels,
} from "../utils/format";

const chartWidth = 700;
const chartHeight = 240;
const padding = {
  top: 20,
  right: 20,
  bottom: 35,
  left: 55,
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load collection data.";

export default function CollectionOverviewChart() {
  const year = new Date().getFullYear();

  const monthlyQuery = useQuery({
    queryKey: ["treasurer", "monthly-finance", year],
    queryFn: () => getMonthlyFinance({ year }),
  });

  if (monthlyQuery.isLoading) {
    return (
      <div className="h-[320px] animate-pulse rounded-xl bg-slate-100" />
    );
  }

  if (monthlyQuery.isError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(monthlyQuery.error)}
      </p>
    );
  }

  const monthlyRows = monthlyQuery.data?.months ?? [];
  const totalCollection = monthlyRows.reduce(
    (total, row) => total + row.collection,
    0,
  );
  const totalExpenses = monthlyRows.reduce(
    (total, row) => total + row.expenses,
    0,
  );
  const maxValue = Math.max(
    1,
    ...monthlyRows.flatMap((row) => [
      row.collection,
      row.expenses,
    ]),
  );

  if (monthlyRows.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No collection or expense data is available for this year.
      </p>
    );
  }

  const drawableWidth =
    chartWidth - padding.left - padding.right;
  const drawableHeight =
    chartHeight - padding.top - padding.bottom;

  const getX = (index: number) =>
    monthlyRows.length === 1
      ? padding.left + drawableWidth / 2
      : padding.left +
        (index / (monthlyRows.length - 1)) * drawableWidth;

  const getY = (value: number) =>
    padding.top +
    drawableHeight -
    (value / maxValue) * drawableHeight;

  const collectionPoints = monthlyRows
    .map((item, index) => `${getX(index)},${getY(item.collection)}`)
    .join(" ");
  const expensePoints = monthlyRows
    .map((item, index) => `${getX(index)},${getY(item.expenses)}`)
    .join(" ");
  const yAxisValues = [0, maxValue / 3, (maxValue / 3) * 2, maxValue];

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
          <span className="text-sm font-medium text-slate-600">
            Collection
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Expenses
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[260px] min-w-[600px] w-full"
          role="img"
          aria-label="Monthly collection and expense chart"
        >
          {yAxisValues.map((value) => {
            const y = getY(value);

            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px]"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {monthlyRows.map((item, index) => (
            <text
              key={item.month}
              x={getX(index)}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[12px]"
            >
              {monthLabels[item.month - 1]}
            </text>
          ))}

          <polyline
            points={collectionPoints}
            fill="none"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={expensePoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {monthlyRows.map((item, index) => (
            <g key={`collection-${item.month}`}>
              <circle
                cx={getX(index)}
                cy={getY(item.collection)}
                r="5"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="3"
              />
              <title>
                {`${monthLabels[item.month - 1]} collection ${formatCurrency(
                  item.collection,
                )}`}
              </title>
            </g>
          ))}

          {monthlyRows.map((item, index) => (
            <g key={`expense-${item.month}`}>
              <circle
                cx={getX(index)}
                cy={getY(item.expenses)}
                r="5"
                fill="#ffffff"
                stroke="#94a3b8"
                strokeWidth="3"
              />
              <title>
                {`${monthLabels[item.month - 1]} expenses ${formatCurrency(
                  item.expenses,
                )}`}
              </title>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">
            Total Collection
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(totalCollection)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">
            Total Expenses
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
