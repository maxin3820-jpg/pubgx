import { useCallback, useEffect, useState } from "react";
import {
  type SiteConfig,
  loadConfig,
  saveConfig,
  resetConfig,
} from "@/lib/site-config";

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(loadConfig);

  // Keep in sync across tabs / admin panel changes
  useEffect(() => {
    const handler = (e: Event) => {
      setConfig((e as CustomEvent<SiteConfig>).detail);
    };
    window.addEventListener("site-config-changed", handler);
    return () => window.removeEventListener("site-config-changed", handler);
  }, []);

  const update = useCallback((patch: Partial<SiteConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = resetConfig();
    setConfig(fresh);
  }, []);

  return { config, update, reset, save: saveConfig };
}
