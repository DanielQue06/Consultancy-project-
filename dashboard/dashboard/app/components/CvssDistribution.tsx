"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface Props {
  buckets: number[]; // [0-2, 2-4, 4-6, 6-8, 8-10]
}

export default function CvssDistribution({ buckets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: ["0–2", "2–4", "4–6", "6–8", "8–10"],
        datasets: [
          {
            label: "Threats",
            data: buckets,
            backgroundColor: ["#10b981", "#10b981", "#f59e0b", "#f97316", "#f43f5e"],
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#6b7280", font: { size: 10 } },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#6b7280", font: { size: 10 }, stepSize: 2 },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [buckets]);

  return (
    <div style={{ position: "relative", width: "100%", height: "240px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}