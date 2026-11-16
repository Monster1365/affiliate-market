"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Point = { day: string; clicks: number };

const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 24, left: 36 };
const MAX_BAR = 24;
const GAP = 2;

/** 보기 좋은 눈금 최댓값 (1, 2, 5 × 10ⁿ) */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * pow >= value / 4)! * pow;
  return Math.ceil(value / step) * step;
}

function label(day: string) {
  const [, m, d] = day.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function weekday(day: string) {
  return ["일", "월", "화", "수", "목", "금", "토"][new Date(`${day}T12:00:00Z`).getUTCDay()];
}

/**
 * 일별 클릭 막대 차트 (단일 계열, 브랜드 파랑).
 * 막대: 최대 24px, 위쪽 4px 둥글게·바닥은 직각, 막대 사이 2px 이상 간격.
 * 마우스를 올리면(또는 키보드 포커스) 날짜·클릭 수 표시. 같은 데이터를 표로도 제공.
 */
export function ClicksChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  // 실제 표시 폭에 맞춰 그린다 (축소하면 모바일에서 글씨가 너무 작아짐)
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = niceMax(Math.max(0, ...data.map((d) => d.clicks)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, Math.min(MAX_BAR, slot - GAP * 2));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  // x축 라벨은 겹치지 않게 최대 7개 정도만
  const labelEvery = Math.ceil(data.length / Math.max(3, Math.floor(plotW / 70)));
  const hovered = active !== null ? data[active] : null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={boxRef} className="relative">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`일별 클릭 수 막대 차트, ${data[0]?.day}부터 ${data.at(-1)?.day}까지`}
          onMouseLeave={() => setActive(null)}
        >
          {/* 눈금선: 1px 실선, 흐리게 */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {Number.isInteger(t) ? t : ""}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const x = PAD.left + i * slot + (slot - barW) / 2;
            const top = y(d.clicks);
            const h = PAD.top + plotH - top;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.day}>
                {/* 마우스 감지 영역: 막대보다 넓게 (열 전체) */}
                <rect
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  className={active === i ? "fill-brand-50" : "fill-transparent"}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  tabIndex={0}
                  aria-label={`${d.day} 클릭 ${d.clicks}회`}
                />
                {d.clicks > 0 && (
                  <path
                    pointerEvents="none"
                    className={active === null || active === i ? "fill-primary" : "fill-primary/60"}
                    d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text
                    x={PAD.left + i * slot + slot / 2}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {label(d.day)}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            className="stroke-muted-foreground/40"
            strokeWidth={1}
          />
        </svg>

        {hovered && active !== null && (
          <div
            role="status"
            className={cn(
              "pointer-events-none absolute top-0 z-10 rounded-lg border bg-background px-3 py-2 text-xs whitespace-nowrap shadow-md",
              // 가장자리에서는 툴팁이 차트 밖으로 나가지 않게 안쪽으로 붙인다
              active < data.length * 0.2 ? "" : active > data.length * 0.8 ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: PAD.left + active * slot + slot / 2 }}
          >
            <p className="text-muted-foreground">
              {label(hovered.day)} ({weekday(hovered.day)})
            </p>
            <p className="font-bold tabular-nums">클릭 {hovered.clicks.toLocaleString("ko-KR")}회</p>
          </div>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">표로 보기</summary>
        <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-1.5 font-medium">날짜</th>
                <th className="px-3 py-1.5 text-right font-medium">클릭 수</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day} className="border-t">
                  <td className="px-3 py-1 tabular-nums">
                    {d.day} ({weekday(d.day)})
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums">{d.clicks.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
