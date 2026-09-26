"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  school: string | null;
  contact: string | null;
  role: string;
  createdAt: string;
};

let cached: SessionUser | null = null;
let cacheTimestamp = 0;
let inflight: Promise<SessionUser | null> | null = null;
type SessionListener = (user: SessionUser | null) => void;
const listeners = new Set<SessionListener>();

const TTL = 20_000;

export function primeSession(user: SessionUser | null) {
  cached = user;
  cacheTimestamp = Date.now();
  listeners.forEach((fn) => fn(user));
}

export function refreshSession(): Promise<SessionUser | null> {
  inflight =
    inflight ??
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user: SessionUser | null }) => {
        cached = data.user ?? null;
        cacheTimestamp = Date.now();
        listeners.forEach((fn) => fn(cached));
        return cached;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  return inflight;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = (next: SessionUser | null) => {
      setUser(next);
      setLoading(false);
    };
    listeners.add(listener);
    const fresh = Date.now() - cacheTimestamp < TTL;

    if (fresh) {
      setUser(cached);
      setLoading(false);
    } else {
      void refreshSession().then((next) => {
        setUser(next);
        setLoading(false);
      });
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { user, loading, refresh: refreshSession };
}
