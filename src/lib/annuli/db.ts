// Облачный слой доступа к данным Annuli.
// Персоны хранятся в таблице public.persons, сканы и фото — в приватном
// хранилище annuli-media (файлы лежат в папке владельца базы).
// Изоляция между пользователями обеспечивается политиками доступа в облаке.
import { supabase } from "@/integrations/supabase/client";

import { fullName } from "./format";
import { normalizePerson, type Person } from "./types";

const BUCKET = "annuli-media";
const PAGE = 1000;

let activeOwner: string | null = null;
const urlCache = new Map<string, { url: string; exp: number }>();

/** Устанавливает владельца базы, с которой сейчас работает интерфейс. */
export function setActiveOwner(id: string | null): void {
  if (id === activeOwner) return;
  activeOwner = id;
  urlCache.clear();
}

export function getActiveOwner(): string | null {
  return activeOwner;
}

async function ownerId(): Promise<string> {
  if (activeOwner) return activeOwner;
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Требуется вход в аккаунт");
  activeOwner = data.user.id;
  return activeOwner;
}

function key(owner: string, imageId: string): string {
  return `${owner}/${imageId}`;
}

export async function dbAllPersons(): Promise<Person[]> {
  const owner = await ownerId();
  const rows: { data: unknown }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("persons")
      .select("data")
      .eq("owner_id", owner)
      .order("person_index", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows.map((r) => normalizePerson(r.data as Partial<Person>));
}

export async function dbPutPerson(p: Person): Promise<void> {
  const owner = await ownerId();
  const { error } = await supabase.from("persons").upsert(
    {
      id: p.id,
      owner_id: owner,
      person_index: p.personIndex || "",
      full_name: fullName(p) || "",
      data: p as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

export async function dbDelPerson(id: string): Promise<void> {
  const owner = await ownerId();
  const { error } = await supabase.from("persons").delete().eq("id", id).eq("owner_id", owner);
  if (error) throw new Error(error.message);
}

export async function imgPut(id: string, blob: Blob): Promise<void> {
  const owner = await ownerId();
  const { error } = await supabase.storage.from(BUCKET).upload(key(owner, id), blob, {
    upsert: true,
    contentType: blob.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
  urlCache.delete(id);
}

export async function imgGet(id: string): Promise<Blob | null> {
  if (!id) return null;
  const owner = await ownerId();
  const { data, error } = await supabase.storage.from(BUCKET).download(key(owner, id));
  if (error || !data) return null;
  return data;
}

/** Подписанная ссылка на изображение (кэшируется в памяти). */
export async function imgUrl(id: string): Promise<string> {
  if (!id) return "";
  const hit = urlCache.get(id);
  if (hit && hit.exp > Date.now()) return hit.url;
  const owner = await ownerId();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key(owner, id), 3600);
  if (error || !data?.signedUrl) return "";
  urlCache.set(id, { url: data.signedUrl, exp: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

export async function imgDel(id: string): Promise<void> {
  if (!id) return;
  const owner = await ownerId();
  urlCache.delete(id);
  await supabase.storage.from(BUCKET).remove([key(owner, id)]);
}
