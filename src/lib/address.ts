// Shared address utilities: normalization, validation, and canonical formatting.
// Ensures Street / Unit / Suite / Building / City / State / ZIP / Country are
// always composed in the correct order across the app (forms, list views, PDFs).

export type AddressParts = {
  address?: string;
  unit?: string;
  suite?: string;
  building?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","PR",
]);

/** Normalize free-form unit/suite text: strip leading "Unit "/"Apt "/"#" duplicates. */
function stripLabel(value: string, labels: string[]): string {
  let v = value.trim();
  for (const lbl of labels) {
    const re = new RegExp(`^${lbl}\\s*[:#-]?\\s*`, "i");
    v = v.replace(re, "");
  }
  return v.replace(/^#\s*/, "").trim();
}

export function normalizeAddressInput(parts: AddressParts): AddressParts {
  return {
    address: parts.address?.trim() ?? "",
    unit: parts.unit ? stripLabel(parts.unit, ["unit", "apt", "apartment"]) : "",
    suite: parts.suite ? stripLabel(parts.suite, ["suite", "ste"]) : "",
    building: parts.building ? stripLabel(parts.building, ["building", "bldg"]) : "",
    city: parts.city?.trim() ?? "",
    state: (parts.state ?? "").trim().toUpperCase(),
    zip: (parts.zip ?? "").trim(),
    country: parts.country?.trim() ?? "",
  };
}

/** Format ZIP into 5 or 5-4 style; passes through if unrecognized. */
export function formatZip(zip: string): string {
  const digits = zip.replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return zip.trim();
}

export type AddressErrors = Partial<Record<keyof AddressParts, string>>;

/**
 * Validate address parts. Returns a map of field -> error message.
 * `requireFull` enforces street/city/state/zip presence; otherwise validation
 * only checks the format of fields that were filled in.
 */
export function validateAddress(parts: AddressParts, requireFull = false): AddressErrors {
  const errors: AddressErrors = {};
  const p = normalizeAddressInput(parts);

  if (requireFull) {
    if (!p.address) errors.address = "Street address is required";
    if (!p.city) errors.city = "City is required";
    if (!p.state) errors.state = "State is required";
    if (!p.zip) errors.zip = "ZIP code is required";
  }

  if (p.state) {
    if (!/^[A-Z]{2}$/.test(p.state)) {
      errors.state = "Use 2-letter state code (e.g. CA)";
    } else if (!US_STATES.has(p.state)) {
      errors.state = "Unknown US state code";
    }
  }

  if (p.zip) {
    const digits = p.zip.replace(/\D/g, "");
    if (digits.length !== 5 && digits.length !== 9) {
      errors.zip = "ZIP must be 5 or 9 digits (e.g. 94538 or 94538-1234)";
    }
  }

  if (p.address && p.address.length > 200) errors.address = "Street address is too long";
  if (p.unit && p.unit.length > 30) errors.unit = "Unit is too long";
  if (p.suite && p.suite.length > 30) errors.suite = "Suite is too long";
  if (p.building && p.building.length > 60) errors.building = "Building is too long";
  if (p.city && p.city.length > 80) errors.city = "City is too long";
  if (p.country && p.country.length > 60) errors.country = "Country is too long";

  return errors;
}

/**
 * Canonical multi-line address used in PDFs, prints, and detail views.
 * Order: Street -> Unit -> Suite -> Building -> City, State ZIP -> Country.
 */
export function formatAddress(parts: AddressParts): string {
  const p = normalizeAddressInput(parts);
  const lines: string[] = [];
  if (p.address) lines.push(p.address);
  if (p.unit) lines.push(`Unit ${p.unit}`);
  if (p.suite) lines.push(`Suite ${p.suite}`);
  if (p.building) lines.push(`Building ${p.building}`);
  const zip = p.zip ? formatZip(p.zip) : "";
  const stateZip = [p.state, zip].filter(Boolean).join(" ");
  const cityStateZip = [p.city, stateZip].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);
  if (p.country) lines.push(p.country);
  return lines.join("\n");
}

/** Single-line variant for compact list/table cells. */
export function formatAddressLine(parts: AddressParts): string {
  return formatAddress(parts).split("\n").filter(Boolean).join(", ");
}
