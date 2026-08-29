// Разовая выгрузка старой локальной базы браузера (IndexedDB) в ZIP,
// чтобы её можно было импортировать в облачную базу пользователя.
import { buildArchive, type ProgressFn } from "./archive";
import { localAllPersons, localImgGet } from "./local-db";

export async function buildLocalArchive(
  onProgress?: ProgressFn,
): Promise<{ blob: Blob; count: number }> {
  const persons = await localAllPersons();
  if (!persons.length) return { blob: new Blob(), count: 0 };
  const blob = await buildArchive(persons, onProgress, localImgGet);
  return { blob, count: persons.length };
}
