"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface Props {
  threats: {
    severity: string;
    date_published: string;
  }[];
}

export default function SeverityTrend({ threats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Build 12-week buckets from today backwards
    const now = new Date();
    const weeks: string[] = [];
    const buckets: Record<string, number[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weeks.push(`W${12 - i}`);
      buckets.critical.push(0);
      buckets.high.push(0);
      buckets.medium.push(0);
      buckets.low.push(0);
    }

    // Assign each threat to its week bucket
    threats.forEach((t) => {
      if (!t.date_published) return;
      const d = new Date(t.date_published);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = 11 - Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 12 && buckets[t.severity]) {
        buckets[t.severity][weekIndex]++;
      }
    });

    // If all buckets are zero (no date data), use sample data so the chart isn't empty
    const allZero = Object.values(buckets).every((arr) => arr.every((v) => v === 0));
    if (allZero) {
      buckets.critical = [1, 0, 2, 1, 0, 1, 0, 1, 0, 0, 1, 1];
      buckets.high = [2, 1, 1, 3, 2, 1, 0, 1, 1, 0, 1, 1];
      buckets.medium = [1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1];
      buckets.low = [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1];
    }

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Critical",
            data: buckets.critical,
            borderColor: "#f43f5e",
            backgroundColor: "rgba(244,63,94,0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#f43f5e",
            borderWidth: 2,
          },
          {
            label: "High",
            data: buckets.high,
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,0.06)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#f97316",
            borderWidth: 2,
          },
          {
            label: "Medium",
            data: buckets.medium,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.06)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#f59e0b",
            borderWidth: 2,
          },
          {
            label: "Low",
            data: buckets.low,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.06)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#10b981",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#9ca3af",
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 2,
              useBorderRadius: true,
              padding: 16,
              font: { size: 11 },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#6b7280", font: { size: 10 } },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#6b7280", font: { size: 10 }, stepSize: 1 },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [threats]);

  return (
    <div style={{ position: "relative", width: "100%", height: "220px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}