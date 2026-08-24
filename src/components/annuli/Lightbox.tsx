import { useEffect, useRef, useState } from "react";

export interface LightboxItem {
  imageId: string;
  title: string;
}

interface Props {
  items: LightboxItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  loadImage: (imageId: string) => Promise<Blob | null>;
}

/** Полноэкранный просмотр скана с зумом, панорамированием и перелистыванием. */
export function Lightbox({ items, index, onIndexChange, onClose, loadImage }: Props) {
  const [url, setUrl] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const item = items[index];

  useEffect(() => {
    let alive = true;
    let objUrl = "";
    setUrl("");
    setScale(1);
    setPan({ x: 0, y: 0 });
    if (!item?.imageId) return;
    loadImage(item.imageId).then((blob) => {
      if (!alive || !blob) return;
      objUrl = URL.createObjectURL(blob);
      setUrl(objUrl);
    });
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [item?.imageId, loadImage]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
      if (ev.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
      if (ev.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (ev.key === "+" || ev.key === "=") setScale((s) => Math.min(8, s * 1.25));
      if (ev.key === "-") setScale((s) => Math.max(0.2, s / 1.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-white">
        <span className="truncate">
          {item.title || "Скан"}
          {items.length > 1 && (
            <span className="ml-2 opacity-60">
              {index + 1} / {items.length}
            </span>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
            onClick={() => setScale((s) => Math.max(0.2, s / 1.25))}
            aria-label="Уменьшить"
          >
            −
          </button>
          <button
            className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
            onClick={() => setScale((s) => Math.min(8, s * 1.25))}
            aria-label="Увеличить"
          >
            +
          </button>
          <button
            className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            1:1
          </button>
          {url && (
            <a
              href={url}
              download={item.title || "scan"}
              className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
            >
              ⤓
            </a>
          )}
          <button
            className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onWheel={(ev) => {
          ev.preventDefault();
          setScale((s) => Math.min(8, Math.max(0.2, s * (ev.deltaY < 0 ? 1.12 : 1 / 1.12))));
        }}
        onPointerDown={(ev) => {
          drag.current = { x: ev.clientX, y: ev.clientY, ox: pan.x, oy: pan.y };
          (ev.target as Element).setPointerCapture?.(ev.pointerId);
        }}
        onPointerMove={(ev) => {
          if (!drag.current) return;
          setPan({
            x: drag.current.ox + (ev.clientX - drag.current.x),
            y: drag.current.oy + (ev.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {url ? (
          <img
            src={url}
            alt={item.title || "Скан документа"}
            draggable={false}
            className="absolute left-1/2 top-1/2 max-h-none select-none"
            style={{
              transform: `translate(-50%,-50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              maxWidth: "92vw",
            }}
          />
        ) : (
          <p className="absolute inset-0 grid place-items-center text-[13px] text-white/60">
            Загрузка изображения…
          </p>
        )}

        {items.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white disabled:opacity-30"
              disabled={index === 0}
              onClick={() => onIndexChange(index - 1)}
              aria-label="Предыдущий скан"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white disabled:opacity-30"
              disabled={index === items.length - 1}
              onClick={() => onIndexChange(index + 1)}
              aria-label="Следующий скан"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
