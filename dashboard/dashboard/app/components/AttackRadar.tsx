"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface Props {
  targets: [string, number][];
}

export default function AttackRadar({ targets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Take top 6 targets for the radar
    const top = targets.slice(0, 6);
    const labels = top.map(([name]) => name);
    const values = top.map(([, count]) => count);

    // If we have fewer than 3 data points, pad with placeholder labels
    while (labels.length < 3) {
      labels.push("—");
      values.push(0);
    }

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Threats",
            data: values,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139,92,246,0.12)",
            borderWidth: 2,
            pointBackgroundColor: "#8b5cf6",
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(255,255,255,0.06)" },
            grid: { color: "rgba(255,255,255,0.06)" },
            pointLabels: { color: "#9ca3af", font: { size: 10 } },
            ticks: { display: false },
            suggestedMin: 0,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [targets]);

  return (
    <div style={{ position: "relative", width: "100%", height: "240px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}