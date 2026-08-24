import { useEffect, useState } from "react";

import { imgGet } from "@/lib/annuli/db";

/**
 * Возвращает URL изображения из IndexedDB. Ссылка создаётся один раз на imageId
 * и освобождается только при смене изображения или размонтировании.
 */
export function useImageUrl(imageId?: string, thumb?: string): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (thumb) {
      setUrl(thumb);
      return;
    }
    if (!imageId) {
      setUrl("");
      return;
    }
    let alive = true;
    let objUrl = "";
    imgGet(imageId)
      .then((blob) => {
        if (!alive || !blob) return;
        objUrl = URL.createObjectURL(blob);
        setUrl(objUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [imageId, thumb]);

  return url;
}
