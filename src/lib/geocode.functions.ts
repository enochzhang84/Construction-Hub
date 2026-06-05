import { createServerFn } from "@tanstack/react-start";

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((data: { address: string }) => {
    if (!data || typeof data.address !== "string" || data.address.length === 0 || data.address.length > 500) {
      throw new Error("Invalid address");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) {
      throw new Error("Google Maps connector not configured");
    }
    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
      },
    });
    if (!res.ok) {
      throw new Error(`Geocode failed (${res.status})`);
    }
    const body = (await res.json()) as {
      status: string;
      results?: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>;
    };
    if (body.status !== "OK" || !body.results?.length) {
      return { ok: false as const, status: body.status };
    }
    const r = body.results[0];
    return {
      ok: true as const,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formatted: r.formatted_address,
    };
  });
