import { useCallback, useEffect, useState } from "react";

import { dbAllPersons, dbDelPerson, dbPutPerson } from "@/lib/annuli/db";
import type { Person } from "@/lib/annuli/types";

export function useAnnuli() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    dbAllPersons()
      .then((rows) => {
        if (alive) setPersons(rows);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const rows = await dbAllPersons();
    setPersons(rows);
    return rows;
  }, []);

  const savePerson = useCallback(async (p: Person) => {
    const rec: Person = { ...p, updatedAt: new Date().toISOString() };
    await dbPutPerson(rec);
    setPersons((prev) => {
      const i = prev.findIndex((x) => x.id === rec.id);
      if (i === -1) return [...prev, rec];
      const next = prev.slice();
      next[i] = rec;
      return next;
    });
    return rec;
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    await dbDelPerson(id);
    setPersons((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { persons, loading, error, savePerson, deletePerson, reload };
}
