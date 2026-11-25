"use client";

import { useCallback, useEffect, useState } from "react";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function useDishLists(scope: string) {
  const recentKey = `meal-assist:recent:${scope}`;
  const favKey = `meal-assist:favorites:${scope}`;
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readList(recentKey));
    setFavorites(readList(favKey));
  }, [recentKey, favKey]);

  const remember = useCallback(
    (id: string) => {
      setRecent((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, 20);
        writeList(recentKey, next);
        return next;
      });
    },
    [recentKey]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
        writeList(favKey, next);
        return next;
      });
    },
    [favKey]
  );

  return { recent, favorites, remember, toggleFavorite };
}
