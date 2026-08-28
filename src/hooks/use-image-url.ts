import { useEffect, useState } from "react";

import { imgUrl } from "@/lib/annuli/db";

/**
 * Возвращает ссылку на изображение из облачного хранилища.
 * Пока ссылка не получена, используется миниатюра (если она есть).
 */
export function useImageUrl(imageId?: string, thumb?: string): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!imageId) {
      setUrl("");
      return;
    }
    let alive = true;
    imgUrl(imageId)
      .then((u) => {
        if (alive && u) setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [imageId]);

  return url || thumb || "";
}
