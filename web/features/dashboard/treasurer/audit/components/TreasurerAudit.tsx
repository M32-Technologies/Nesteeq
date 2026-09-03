"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  FileClock,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import {
  getAuditLogs,
  type AuditLog,
} from "../../services/treasurer.service";
import { formatDate } from "../../utils/format";

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load audit records.";

const formatValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return "None";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

export default function TreasurerAudit() {
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const auditQuery = useQuery({
    queryKey: [
      "treasurer",
      "audit",
      actionFilter,
      entityFilter,
    ],
    queryFn: () =>
      getAuditLogs({
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      }),
  });

  const auditLogs = auditQuery.data ?? [];
  const totalRecords = auditLogs.length;
  const paymentActions = auditLogs.filter((record) =>
    record.action.includes("PAYMENT"),
  ).length;
  const billingActions = auditLogs.filter(
    (record) => record.entityType === "Billing",
  ).length;
  const expenseActions = auditLogs.filter(
    (record) => record.entityType === "Expense",
  ).length;
  const auditSummary = [
    {
      title: "Total Records",
      value: totalRecords.toString(),
      icon: FileClock,
    },
    {
      title: "Billing Actions",
      value: billingActions.toString(),
      icon: ReceiptText,
    },
    {
      title: "Payment Actions",
      value: paymentActions.toString(),
      icon: Activity,
    },
    {
      title: "Expense Actions",
      value: expenseActions.toString(),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Audit Trail
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review recorded financial actions and changes made by
          authorized users.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Immutable Financial History
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Audit routes are read-only and financial writes create
              append-only records.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {auditSummary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Financial Activity Log
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete history of important Treasurer financial actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value)
              }
              placeholder="Action"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
            <input
              type="text"
              value={entityFilter}
              onChange={(event) =>
                setEntityFilter(event.target.value)
              }
              placeholder="Entity type"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto p-6">
          {auditQuery.isLoading ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Loading audit records...
            </p>
          ) : auditQuery.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getSafeErrorMessage(auditQuery.error)}
            </p>
          ) : auditLogs.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No audit records available.
            </p>
          ) : (
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Actor</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Entity</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Before</th>
                  <th className="pb-3 font-medium">After</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((record: AuditLog) => (
                  <tr
                    key={record._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-4 font-medium text-slate-900">
                      {record.performedBy || "System"}
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {record.action}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">
                      {record.entityType}
                      <span className="block break-all text-xs text-slate-400">
                        {record.entityId}
                      </span>
                    </td>
                    <td className="max-w-sm py-4 text-slate-600">
                      {record.description || "No description"}
                    </td>
                    <td className="max-w-xs break-words py-4 text-xs text-slate-500">
                      {formatValue(record.oldValue)}
                    </td>
                    <td className="max-w-xs break-words py-4 text-xs text-slate-500">
                      {formatValue(record.newValue)}
                    </td>
                    <td className="py-4 text-slate-600">
                      {formatDate(record.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
