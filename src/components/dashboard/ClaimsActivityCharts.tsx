"use client";

import { OVERALL_STAGES } from "@/components/claims/ClaimProgress";
import ComponentCard from "@/components/common/ComponentCard";
import { useTheme } from "@/context/ThemeContext";
import type { MockState } from "@/lib/mock/types";
import { cn } from "@/utils";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Series colours, validated with the dataviz palette checker against the card
// surfaces (light #ffffff, dark #101828): brand red + blue pass every CVD,
// normal-vision and contrast gate in both modes.
const PALETTE = {
  light: { lodged: "#d31212", closed: "#2a78d6", grid: "#f2f4f7", axis: "#667085" },
  dark: { lodged: "#ee3232", closed: "#3987e5", grid: "#1d2939", axis: "#98a2b3" },
};
const MONTHS = 6;

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

/** Lodged vs closed per month for the last six months, from claims + the audit trail. */
function activityByMonth(state: MockState) {
  const now = new Date();
  const months = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-ZA", { month: "short" }),
      long: d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
    };
  });
  const lodged = months.map((m) => state.claims.filter((c) => monthKey(c.createdAt) === m.key).length);
  const closed = months.map((m) => state.auditEntries.filter((a) => a.action === "Claim closed" && monthKey(a.createdAt) === m.key).length);
  return { months, lodged, closed };
}

/** Open (not closed) claims grouped into the broker-facing journey stages. */
function openByStage(state: MockState) {
  const stages = OVERALL_STAGES.filter((s) => s.label !== "Closed");
  return stages.map((stage) => ({
    label: stage.label,
    count: state.claims.filter((c) => {
      const status = c.status === "disputed" ? (c.preDisputeStatus ?? "awaiting_insurer_decision") : c.status;
      return stage.statuses.includes(status);
    }).length,
  }));
}

function ViewToggle({ table, onChange }: { table: boolean; onChange: (table: boolean) => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 p-0.5 dark:border-gray-800" role="group" aria-label="View">
      {(["Chart", "Table"] as const).map((label) => {
        const active = (label === "Table") === table;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(label === "Table")}
            className={cn(
              "rounded px-2 py-0.5 text-theme-xs font-medium transition-colors",
              active ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const th = "px-5 py-2 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400";
const td = "px-5 py-2 text-theme-sm text-gray-700 tabular-nums dark:text-gray-300";

// Administrator dashboard overview: monthly claims activity and the open-claims
// pipeline. Each chart has a table twin so no value is reachable only by hover.
export default function ClaimsActivityCharts({ state }: { state: MockState }) {
  const { theme } = useTheme();
  const c = PALETTE[theme === "dark" ? "dark" : "light"];
  const [trendTable, setTrendTable] = useState(false);
  const [stageTable, setStageTable] = useState(false);

  const { months, lodged, closed } = activityByMonth(state);
  const stages = openByStage(state);
  const totalLodged = lodged.reduce((a, b) => a + b, 0);
  const totalClosed = closed.reduce((a, b) => a + b, 0);
  const openTotal = stages.reduce((a, s) => a + s.count, 0);
  const stageMax = Math.max(1, ...stages.map((s) => s.count));

  const base: ApexOptions = {
    chart: { fontFamily: "Inter, sans-serif", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: "transparent" },
    theme: { mode: theme === "dark" ? "dark" : "light" },
    dataLabels: { enabled: false },
    grid: { borderColor: c.grid, strokeDashArray: 0, padding: { left: 4, right: 8 } },
    states: { hover: { filter: { type: "darken" } } },
  };

  const trendOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "bar" },
    colors: [c.lodged, c.closed],
    plotOptions: { bar: { columnWidth: "42%", borderRadius: 4, borderRadiusApplication: "end" } },
    stroke: { show: true, width: 2, colors: ["transparent"] }, // 2px surface gap between paired bars
    xaxis: {
      categories: months.map((m) => m.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: c.axis, fontSize: "12px" } },
    },
    yaxis: { min: 0, forceNiceScale: true, decimalsInFloat: 0, labels: { style: { colors: c.axis, fontSize: "12px" } } },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px", labels: { colors: c.axis }, markers: { size: 5, shape: "circle" }, itemMargin: { horizontal: 10 } },
    tooltip: { shared: true, intersect: false, y: { formatter: (v) => `${v} ${v === 1 ? "claim" : "claims"}` } },
  };

  const stageOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: "bar" },
    colors: [c.lodged],
    plotOptions: { bar: { horizontal: true, barHeight: "46%", borderRadius: 4, borderRadiusApplication: "end", dataLabels: { position: "top" } } },
    dataLabels: { enabled: true, offsetX: 18, style: { fontSize: "12px", fontWeight: 600, colors: [theme === "dark" ? "#e4e7ec" : "#344054"] } },
    xaxis: {
      categories: stages.map((s) => s.label),
      min: 0,
      // One step of headroom past the longest bar so its value label sits outside the bar end.
      max: stageMax + 1,
      tickAmount: stageMax + 1 <= 6 ? stageMax + 1 : 5,
      decimalsInFloat: 0,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: c.axis, fontSize: "12px" } },
    },
    yaxis: { labels: { style: { colors: [c.axis], fontSize: "12px" } } },
    grid: { ...base.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: { y: { formatter: (v) => `${v} open ${v === 1 ? "claim" : "claims"}` } },
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <ComponentCard
        title="Claims activity"
        desc={`Lodged vs closed, last ${MONTHS} months · ${totalLodged} lodged, ${totalClosed} closed`}
        action={<ViewToggle table={trendTable} onChange={setTrendTable} />}
        className="xl:col-span-2"
      >
        {trendTable ? (
          <table className="-mx-5 -my-5 w-[calc(100%+2.5rem)]">
            <thead className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
              <tr>
                <th className={th}>Month</th>
                <th className={th}>Lodged</th>
                <th className={th}>Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {months.map((m, i) => (
                <tr key={m.key}>
                  <td className={td}>{m.long}</td>
                  <td className={td}>{lodged[i]}</td>
                  <td className={td}>{closed[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="-mx-2 -mt-2 -mb-3">
            <ReactApexChart
              key={theme}
              type="bar"
              height={260}
              options={trendOptions}
              series={[
                { name: "Lodged", data: lodged },
                { name: "Closed", data: closed },
              ]}
            />
          </div>
        )}
      </ComponentCard>

      <ComponentCard
        title="Open claims by stage"
        desc={`${openTotal} open ${openTotal === 1 ? "claim" : "claims"} across every broker`}
        action={<ViewToggle table={stageTable} onChange={setStageTable} />}
      >
        {stageTable ? (
          <table className="-mx-5 -my-5 w-[calc(100%+2.5rem)]">
            <thead className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
              <tr>
                <th className={th}>Stage</th>
                <th className={th}>Open claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stages.map((s) => (
                <tr key={s.label}>
                  <td className={td}>{s.label}</td>
                  <td className={td}>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="-mx-2 -mt-3 -mb-3">
            <ReactApexChart key={theme} type="bar" height={260} options={stageOptions} series={[{ name: "Open claims", data: stages.map((s) => s.count) }]} />
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
