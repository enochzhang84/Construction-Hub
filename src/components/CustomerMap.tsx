/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { geocodeAddress } from "@/lib/geocode.functions";
import type { Customer } from "@/lib/data";
import type { Project, ProjectStatus } from "@/lib/project-store";
import { statusLabel } from "@/lib/project-store";
import { useLocale } from "@/lib/i18n";

export type CustomerMapRow = {
  c: Customer;
  latest?: Project;
  estTotal: number;
  contractTotal: number;
  due: number;
};

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

const CACHE_KEY = "construction-hub-geocode-cache-v1";
type CacheEntry = { lat: number; lng: number } | { failed: true };
type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(c: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

function fullAddress(c: Customer): string {
  return [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ").trim();
}

function statusColor(status: ProjectStatus | undefined): { dot: string; hex: string } {
  // blue: Estimate (审核中), orange: Active (施工中), green: Pending Payment (待结算), gray: Completed
  switch (status) {
    case "Estimate":
      return { dot: "blue-dot.png", hex: "#2563eb" };
    case "Active":
      return { dot: "orange-dot.png", hex: "#f97316" };
    case "Pending Payment":
      return { dot: "green-dot.png", hex: "#16a34a" };
    case "Completed":
      return { dot: "grey.png", hex: "#6b7280" };
    case "Cancelled":
      return { dot: "red-dot.png", hex: "#dc2626" };
    default:
      return { dot: "purple-dot.png", hex: "#7c3aed" };
  }
}

// Singleton loader for the Maps JS API
let mapsLoadPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (mapsLoadPromise) return mapsLoadPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsLoadPromise = new Promise((resolve, reject) => {
    (window as any).__initCustomerMap = () => {
      resolve((window as any).google);
    };
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__initCustomerMap",
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

function fmt$(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function CustomerMap({ rows }: { rows: CustomerMapRow[] }) {
  const locale = useLocale();
  const geocode = useServerFn(geocodeAddress);
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const points = useMemo(
    () => rows.filter((r) => fullAddress(r.c).length > 0),
    [rows],
  );

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapEl.current) return;
        mapRef.current = new google.maps.Map(mapEl.current, {
          center: { lat: 37.5, lng: -122.0 }, // Bay Area default
          zoom: 9,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        infoRef.current = new google.maps.InfoWindow();
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Map load failed");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Plot markers
  useEffect(() => {
    if (!mapRef.current || loading) return;
    const google = (window as any).google;
    if (!google) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const cache = loadCache();
    let done = 0;
    setProgress({ done: 0, total: points.length });
    const bounds = new google.maps.LatLngBounds();
    let plotted = 0;
    let cancelled = false;

    const plot = (row: CustomerMapRow, lat: number, lng: number) => {
      const color = statusColor(row.latest?.status);
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: row.c.name,
        icon: {
          url: `https://maps.google.com/mapfiles/ms/icons/${color.dot}`,
          scaledSize: new google.maps.Size(32, 32),
        },
      });
      marker.addListener("click", () => {
        const statusTxt = row.latest
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${color.hex};color:white;font-size:11px;font-weight:500;">${statusLabel(row.latest.status, locale)}</span>`
          : `<span style="color:#6b7280;font-size:11px;">${locale === "zh" ? "无报价" : "No estimate"}</span>`;
        const amtLine = row.latest
          ? `<div style="margin-top:6px;font-size:12px;"><b>${locale === "zh" ? "报价金额" : "Estimate"}:</b> ${fmt$(row.latest.amount || 0)}</div>`
          : "";
        const dueLine = row.due > 0
          ? `<div style="font-size:12px;color:#b45309;"><b>${locale === "zh" ? "待收款" : "Outstanding"}:</b> ${fmt$(row.due)}</div>`
          : "";
        const html = `
          <div style="font-family:system-ui,-apple-system,sans-serif;min-width:220px;max-width:280px;color:#111;">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${escapeHtml(row.c.name)}</div>
            <div style="margin-bottom:6px;">${statusTxt}</div>
            <div style="font-size:12px;color:#444;"><b>${locale === "zh" ? "电话" : "Phone"}:</b> ${escapeHtml(row.c.phone || "—")}</div>
            <div style="font-size:12px;color:#444;margin-top:2px;"><b>${locale === "zh" ? "项目地址" : "Address"}:</b> ${escapeHtml(fullAddress(row.c))}</div>
            ${amtLine}
            ${dueLine}
          </div>`;
        infoRef.current.setContent(html);
        infoRef.current.open({ anchor: marker, map: mapRef.current });
      });
      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
      plotted += 1;
    };

    const finalize = () => {
      if (cancelled) return;
      if (plotted > 0) {
        mapRef.current.fitBounds(bounds, 64);
        if (plotted === 1) {
          // Avoid extreme zoom
          const listener = google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
            if (mapRef.current.getZoom() > 14) mapRef.current.setZoom(14);
          });
          // keep ref to avoid unused warning
          void listener;
        }
      }
    };

    (async () => {
      for (const row of points) {
        if (cancelled) return;
        const addr = fullAddress(row.c);
        const cached = cache[addr];
        if (cached && "lat" in cached) {
          plot(row, cached.lat, cached.lng);
        } else if (cached && "failed" in cached) {
          // skip known failures
        } else {
          try {
            const res = await geocode({ data: { address: addr } });
            if (res.ok) {
              cache[addr] = { lat: res.lat, lng: res.lng };
              plot(row, res.lat, res.lng);
            } else {
              cache[addr] = { failed: true };
            }
            saveCache(cache);
          } catch {
            cache[addr] = { failed: true };
            saveCache(cache);
          }
        }
        done += 1;
        if (!cancelled) setProgress({ done, total: points.length });
      }
      finalize();
    })();

    return () => {
      cancelled = true;
    };
  }, [points, loading, geocode, locale]);

  if (!BROWSER_KEY) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-panel">
        {locale === "zh" ? "Google Maps 未配置" : "Google Maps is not configured"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-panel">
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color="#2563eb" label={statusLabel("Estimate", locale)} />
          <LegendDot color="#f97316" label={statusLabel("Active", locale)} />
          <LegendDot color="#16a34a" label={statusLabel("Pending Payment", locale)} />
          <LegendDot color="#6b7280" label={statusLabel("Completed", locale)} />
        </div>
        <div className="text-muted-foreground">
          {progress.total > 0 && progress.done < progress.total
            ? `${locale === "zh" ? "正在解析地址" : "Geocoding"} ${progress.done}/${progress.total}`
            : `${markersRef.current.length} ${locale === "zh" ? "个标记" : "markers"}`}
        </div>
      </div>
      <div className="relative h-[560px] overflow-hidden rounded-lg border border-border bg-card shadow-panel">
        <div ref={mapEl} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {locale === "zh" ? "正在加载地图…" : "Loading map…"}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
