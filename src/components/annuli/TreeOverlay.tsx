import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initials } from "@/lib/annuli/format";
import { layoutTree } from "@/lib/annuli/tree";
import type { Person } from "@/lib/annuli/types";

interface Props {
  persons: Person[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function TreeOverlay({ persons, currentId, onSelect, onClose }: Props) {
  const [showLateral, setShowLateral] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<number>(0);
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => layoutTree(persons, showLateral), [persons, showLateral]);

  const zoom = useCallback((f: number) => {
    setScale((s) => Math.min(4, Math.max(0.1, s * f)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      setPan({
        x: drag.current.px + (e.clientX - drag.current.x),
        y: drag.current.py + (e.clientY - drag.current.y),
      });
    };
    const up = () => {
      drag.current = null;
      setDragging(false);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // Колесо и жесты: неактивные слушатели React не могут вызвать preventDefault.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.12 : 0.89);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0]!;
        drag.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y };
      } else if (e.touches.length === 2) {
        drag.current = null;
        pinch.current = Math.hypot(
          e.touches[1]!.clientX - e.touches[0]!.clientX,
          e.touches[1]!.clientY - e.touches[0]!.clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && drag.current) {
        e.preventDefault();
        const t = e.touches[0]!;
        setPan({
          x: drag.current.px + (t.clientX - drag.current.x),
          y: drag.current.py + (t.clientY - drag.current.y),
        });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[1]!.clientX - e.touches[0]!.clientX,
          e.touches[1]!.clientY - e.touches[0]!.clientY,
        );
        if (pinch.current > 0) zoom(d / pinch.current);
        pinch.current = d;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        drag.current = null;
        pinch.current = 0;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoom, pan.x, pan.y]);

  const { nodeHeight: nH, avaR, padL, gapAvaText } = layout;

  return (
    <div className="fixed inset-0 z-[900] flex flex-col bg-background text-foreground">
      <div className="flex min-h-[46px] flex-wrap items-center gap-3 border-b border-border bg-card px-3 py-2">
        <span className="text-[15px] font-bold">🌳 Родословное дерево</span>
        <label className="flex items-center gap-1.5 text-[12px]">
          <input
            type="checkbox"
            checked={showLateral}
            onChange={(e) => setShowLateral(e.target.checked)}
          />
          Боковые ветви
        </label>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          персон: {layout.nodes.length}
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => zoom(1.2)}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] transition hover:bg-muted"
          >
            ＋
          </button>
          <button
            onClick={() => zoom(0.8)}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] transition hover:bg-muted"
          >
            －
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] transition hover:bg-muted"
          >
            ✕ Закрыть
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        onMouseDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          setDragging(true);
        }}
        className={
          "relative flex-1 touch-none overflow-hidden bg-muted/30 " +
          (dragging ? "cursor-grabbing" : "cursor-grab")
        }
      >
        {layout.nodes.length === 0 ? (
          <p className="p-8 text-[13px] text-muted-foreground">Нет персон для отображения</p>
        ) : (
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            <defs>
              <clipPath id="treeAvaClip" clipPathUnits="objectBoundingBox">
                <circle cx="0.5" cy="0.5" r="0.5" />
              </clipPath>
            </defs>

            {layout.genLabels.map((g) => (
              <text
                key={g.gen}
                x={layout.labelGutter - 24}
                y={g.y}
                textAnchor="end"
                className="fill-muted-foreground text-[12px] font-bold uppercase tracking-wide"
              >
                Поколение {g.gen}
              </text>
            ))}

            {layout.edges.map((ed, i) => {
              const fr = layout.nodes.find((n) => n.person.id === ed.from);
              const to = layout.nodes.find((n) => n.person.id === ed.to);
              if (!fr || !to) return null;
              if (ed.type === "parent") {
                const ox = fr.x + fr.w / 2;
                const oy = fr.y + nH;
                const cx = to.x + to.w / 2;
                const cy = to.y;
                const midY = oy + Math.max(20, (cy - oy) / 2);
                return (
                  <path
                    key={"p" + i}
                    d={`M${ox},${oy} L${ox},${midY} L${cx},${midY} L${cx},${cy}`}
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-border"
                  />
                );
              }
              const l = fr.x <= to.x ? fr : to;
              const r = fr.x <= to.x ? to : fr;
              const x1 = l.x + l.w;
              const y1 = l.y + nH / 2;
              const x2 = r.x;
              const y2 = r.y + nH / 2;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              return (
                <g key={"m" + i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    strokeWidth={2}
                    className="stroke-primary"
                  />
                  <circle
                    cx={mx - 4.5}
                    cy={my}
                    r={6.5}
                    className="fill-background stroke-primary"
                    strokeWidth={1.8}
                  />
                  <circle
                    cx={mx + 4.5}
                    cy={my}
                    r={6.5}
                    className="fill-background stroke-primary"
                    strokeWidth={1.8}
                  />
                </g>
              );
            })}

            {layout.nodes.map((node) => {
              const p = node.person;
              const avaCx = node.x + padL + avaR;
              const avaCy = node.y + nH / 2;
              const textX = node.x + padL + avaR * 2 + gapAvaText;
              const sel = p.id === currentId;
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(p.id)}
                  role="button"
                >
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={nH}
                    rx={14}
                    className={sel ? "fill-card stroke-primary" : "fill-card stroke-border"}
                    strokeWidth={sel ? 2.5 : 1}
                    strokeDasharray={p.isLateral ? "5,3" : undefined}
                  />
                  {p.avatarThumb ? (
                    <image
                      href={p.avatarThumb}
                      x={avaCx - avaR}
                      y={avaCy - avaR}
                      width={avaR * 2}
                      height={avaR * 2}
                      clipPath="url(#treeAvaClip)"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <>
                      <circle cx={avaCx} cy={avaCy} r={avaR} className="fill-muted" />
                      <text
                        x={avaCx}
                        y={avaCy + 5}
                        textAnchor="middle"
                        className="fill-primary text-[16px] font-bold"
                      >
                        {initials(p)}
                      </text>
                    </>
                  )}
                  <text x={textX} y={node.y + 22} className="fill-muted-foreground text-[10px]">
                    {node.idxTxt}
                  </text>
                  <text x={textX} y={node.y + 43} className="fill-card-foreground text-[13px] font-medium">
                    {node.firstMid}
                  </text>
                  <text x={textX} y={node.y + 62} className="fill-card-foreground text-[14px] font-bold">
                    {node.surname}
                  </text>
                  <text x={textX} y={node.y + 80} className="fill-muted-foreground text-[11px]">
                    {node.dtTxt}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
