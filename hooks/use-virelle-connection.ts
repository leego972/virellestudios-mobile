import { useState, useEffect } from "react";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { getApiBaseUrl } from "@/constants/oauth";

  export interface VirellConnection {
    connected: boolean;
    loading: boolean;
    byokVideoRequired: boolean;
    creatorUpgrade: boolean;
    swappysStudio: boolean;
    watermarkControls: boolean;
    checkedAt: Date | null;
  }

  const CACHE_KEY = "virelle:connection_v1";
  const CACHE_TTL_MS = 2 * 60 * 1000;
  const DISCONNECTED: VirellConnection = {
    connected: false, loading: false,
    byokVideoRequired: false, creatorUpgrade: false,
    swappysStudio: false, watermarkControls: false, checkedAt: null,
  };

  export function useVirellConnection(): VirellConnection {
    const [status, setStatus] = useState<VirellConnection>({ ...DISCONNECTED, loading: true });
    useEffect(() => {
      let cancelled = false;
      async function check() {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) { if (!cancelled) setStatus(DISCONNECTED); return; }
        try {
          const raw = await AsyncStorage.getItem(CACHE_KEY);
          if (raw) {
            const { data, fetchedAt } = JSON.parse(raw) as { data: VirellConnection; fetchedAt: number };
            if (Date.now() - fetchedAt < CACHE_TTL_MS) { if (!cancelled) setStatus({ ...data, loading: false }); return; }
          }
        } catch (_) {}
        try {
          const res = await fetch(`${baseUrl}/api/mobile/features`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const flags = data.flags ?? {};
          const next: VirellConnection = {
            connected: true, loading: false,
            byokVideoRequired: !!flags.byokVideoRequired, creatorUpgrade: !!flags.creatorUpgrade,
            swappysStudio: !!flags.swappysStudio, watermarkControls: !!flags.watermarkControls,
            checkedAt: new Date(),
          };
          if (!cancelled) setStatus(next);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: next, fetchedAt: Date.now() }));
        } catch (_) { if (!cancelled) setStatus(DISCONNECTED); }
      }
      check();
      return () => { cancelled = true; };
    }, []);
    return status;
  }
  