// Seed data for Construction Hub V1 (local/in-memory)

export type PricingType =
  | "Labor Only"
  | "Labor + Material"
  | "Customer Supplied Material"
  | "Turnkey"
  | "Estimate"
  | "Custom";

export const PRICING_TYPES: PricingType[] = [
  "Labor Only",
  "Labor + Material",
  "Customer Supplied Material",
  "Turnkey",
  "Estimate",
  "Custom",
];

export interface Category {
  id: string;
  name: string;
  nameZh: string;
  icon: string; // lucide name
}

export interface PriceItem {
  id: string;
  categoryId: string;
  name: string;
  nameZh?: string;
  unit: string;
  defaultPricing: PricingType;
  laborRate: number; // per unit
  materialRate: number; // per unit
  hoursPerUnit: number;
  notes?: string;
}

// Chinese names for all price items, keyed by id
const PRICE_ITEM_ZH: Record<string, string> = {
  "demo-1": "室内拆除",
  "demo-2": "厨房橱柜拆除",
  "demo-3": "地砖拆除",
  "demo-4": "浴缸拆除",
  "framing-1": "室内墙体框架",
  "framing-2": "门梁安装",
  "drywall-1": "石膏板安装 (1/2\")",
  "drywall-2": "石膏板接缝与喷涂",
  "paint-1": "室内墙面油漆（两遍）",
  "paint-2": "橱柜翻新",
  "paint-3": "外墙拉毛漆",
  "flooring-1": "LVP 地板安装",
  "flooring-2": "SPC 地板安装",
  "flooring-3": "实木地板安装",
  "flooring-4": "瓷砖安装",
  "flooring-5": "自流平垫层",
  "flooring-6": "踢脚线安装",
  "electrical-1": "插座安装",
  "electrical-2": "嵌入式筒灯 (6\")",
  "electrical-3": "200A 电箱升级",
  "electrical-4": "EV 充电桩电路",
  "plumbing-1": "马桶安装",
  "plumbing-2": "热水器 (50加仑)",
  "plumbing-3": "淋浴阀门粗装",
  "hvac-1": "分体空调 (12k BTU)",
  "hvac-2": "风管铺设",
  "kitchen-1": "厨柜安装（成品柜）",
  "kitchen-2": "石英石台面",
  "kitchen-3": "厨房墙砖",
  "bath-1": "整体卫浴翻新（标准）",
  "bath-2": "瓷砖淋浴墙",
  "bath-3": "浴室柜安装 (36\")",
  "doorwindow-1": "室内门（成品门）",
  "doorwindow-2": "塑钢窗更换",
  "doorwindow-3": "推拉玻璃门",
  "roof-1": "沥青瓦屋顶翻新",
  "roof-2": "雨水槽安装",
  "siding-1": "拉毛墙修补",
  "siding-2": "Hardie 板外墙",
  "concrete-1": "混凝土地坪 (4\")",
  "concrete-2": "车道延伸",
  "landscape-1": "草皮铺设",
  "landscape-2": "滴灌系统分区",
  "fence-1": "木质围栏 (6')",
  "fence-2": "塑料围栏",
  "deck-1": "复合材料露台",
  "deck-2": "混凝土露台",
  "adu-1": "独立 ADU（按平方英尺）",
  "adu-2": "车库改 ADU",
};

export const CATEGORIES: Category[] = [
  { id: "demo", name: "Demolition", nameZh: "拆除工程", icon: "Hammer" },
  { id: "framing", name: "Rough Framing", nameZh: "粗木工", icon: "Construction" },
  { id: "drywall", name: "Drywall", nameZh: "石膏板", icon: "Square" },
  { id: "paint", name: "Painting", nameZh: "油漆工程", icon: "Paintbrush" },
  { id: "flooring", name: "Flooring", nameZh: "地板工程", icon: "LayoutGrid" },
  { id: "electrical", name: "Electrical", nameZh: "电气工程", icon: "Zap" },
  { id: "plumbing", name: "Plumbing", nameZh: "水暖工程", icon: "Droplet" },
  { id: "hvac", name: "HVAC", nameZh: "HVAC 暖通", icon: "Wind" },
  { id: "kitchen", name: "Kitchen Remodel", nameZh: "厨房翻新", icon: "ChefHat" },
  { id: "bath", name: "Bathroom Remodel", nameZh: "卫生间翻新", icon: "Bath" },
  { id: "doorwindow", name: "Doors & Windows", nameZh: "门窗工程", icon: "DoorOpen" },
  { id: "roof", name: "Roofing", nameZh: "屋顶工程", icon: "Home" },
  { id: "siding", name: "Siding & Exterior", nameZh: "外墙工程", icon: "Building2" },
  { id: "concrete", name: "Concrete", nameZh: "混凝土工程", icon: "Box" },
  { id: "landscape", name: "Landscaping", nameZh: "园林绿化", icon: "Trees" },
  { id: "fence", name: "Fencing", nameZh: "围栏工程", icon: "Fence" },
  { id: "deck", name: "Deck & Patio", nameZh: "露台工程", icon: "Grid3x3" },
  { id: "adu", name: "ADU Addition", nameZh: "ADU 加建", icon: "Plus" },
];

export const PRICE_ITEMS: PriceItem[] = [
  // Demolition
  { id: "demo-1", categoryId: "demo", name: "General Interior Demo", unit: "sqft", defaultPricing: "Labor Only", laborRate: 2.5, materialRate: 0, hoursPerUnit: 0.05 },
  { id: "demo-2", categoryId: "demo", name: "Kitchen Cabinet Removal", unit: "lf", defaultPricing: "Labor Only", laborRate: 15, materialRate: 0, hoursPerUnit: 0.3 },
  { id: "demo-3", categoryId: "demo", name: "Flooring Removal (Tile)", unit: "sqft", defaultPricing: "Labor Only", laborRate: 3.5, materialRate: 0, hoursPerUnit: 0.06 },
  { id: "demo-4", categoryId: "demo", name: "Bathtub Removal", unit: "ea", defaultPricing: "Labor Only", laborRate: 250, materialRate: 0, hoursPerUnit: 3 },

  // Framing
  { id: "framing-1", categoryId: "framing", name: "Interior Wall Framing", unit: "lf", defaultPricing: "Labor + Material", laborRate: 18, materialRate: 12, hoursPerUnit: 0.4 },
  { id: "framing-2", categoryId: "framing", name: "Header Installation", unit: "ea", defaultPricing: "Labor + Material", laborRate: 180, materialRate: 85, hoursPerUnit: 2 },

  // Drywall
  { id: "drywall-1", categoryId: "drywall", name: "Drywall Install (1/2\")", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 1.8, materialRate: 0.9, hoursPerUnit: 0.04 },
  { id: "drywall-2", categoryId: "drywall", name: "Tape & Texture", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 1.5, materialRate: 0.4, hoursPerUnit: 0.03 },

  // Paint
  { id: "paint-1", categoryId: "paint", name: "Interior Wall Paint (2 coats)", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 1.2, materialRate: 0.6, hoursPerUnit: 0.02 },
  { id: "paint-2", categoryId: "paint", name: "Cabinet Refinishing", unit: "ea", defaultPricing: "Labor + Material", laborRate: 85, materialRate: 25, hoursPerUnit: 1.5 },
  { id: "paint-3", categoryId: "paint", name: "Exterior Stucco Paint", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 2.2, materialRate: 0.9, hoursPerUnit: 0.03 },

  // Flooring
  { id: "flooring-1", categoryId: "flooring", name: "LVP Installation", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 2.5, materialRate: 3.5, hoursPerUnit: 0.05 },
  { id: "flooring-2", categoryId: "flooring", name: "SPC Installation", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 2.5, materialRate: 4.0, hoursPerUnit: 0.05 },
  { id: "flooring-3", categoryId: "flooring", name: "Hardwood Installation", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 4.5, materialRate: 6.5, hoursPerUnit: 0.08 },
  { id: "flooring-4", categoryId: "flooring", name: "Tile Installation", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 6.5, materialRate: 5.0, hoursPerUnit: 0.12 },
  { id: "flooring-5", categoryId: "flooring", name: "Self-Leveling Underlayment", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 1.8, materialRate: 1.2, hoursPerUnit: 0.04 },
  { id: "flooring-6", categoryId: "flooring", name: "Baseboard Installation", unit: "lf", defaultPricing: "Labor + Material", laborRate: 3.5, materialRate: 1.8, hoursPerUnit: 0.08 },

  // Electrical
  { id: "electrical-1", categoryId: "electrical", name: "Outlet / Receptacle", unit: "ea", defaultPricing: "Labor + Material", laborRate: 65, materialRate: 18, hoursPerUnit: 0.75 },
  { id: "electrical-2", categoryId: "electrical", name: "Recessed Light (6\")", unit: "ea", defaultPricing: "Labor + Material", laborRate: 95, materialRate: 35, hoursPerUnit: 1 },
  { id: "electrical-3", categoryId: "electrical", name: "200A Panel Upgrade", unit: "ea", defaultPricing: "Turnkey", laborRate: 1800, materialRate: 1200, hoursPerUnit: 16 },
  { id: "electrical-4", categoryId: "electrical", name: "EV Charger Circuit", unit: "ea", defaultPricing: "Turnkey", laborRate: 650, materialRate: 350, hoursPerUnit: 6 },

  // Plumbing
  { id: "plumbing-1", categoryId: "plumbing", name: "Toilet Install", unit: "ea", defaultPricing: "Labor + Material", laborRate: 285, materialRate: 220, hoursPerUnit: 2.5 },
  { id: "plumbing-2", categoryId: "plumbing", name: "Water Heater (50gal)", unit: "ea", defaultPricing: "Turnkey", laborRate: 650, materialRate: 950, hoursPerUnit: 5 },
  { id: "plumbing-3", categoryId: "plumbing", name: "Shower Valve Rough-in", unit: "ea", defaultPricing: "Labor + Material", laborRate: 350, materialRate: 180, hoursPerUnit: 3 },

  // HVAC
  { id: "hvac-1", categoryId: "hvac", name: "Mini-Split (12k BTU)", unit: "ea", defaultPricing: "Turnkey", laborRate: 1200, materialRate: 1800, hoursPerUnit: 10 },
  { id: "hvac-2", categoryId: "hvac", name: "Ductwork Run", unit: "lf", defaultPricing: "Labor + Material", laborRate: 25, materialRate: 18, hoursPerUnit: 0.4 },

  // Kitchen
  { id: "kitchen-1", categoryId: "kitchen", name: "Cabinet Install (Stock)", unit: "lf", defaultPricing: "Labor + Material", laborRate: 85, materialRate: 220, hoursPerUnit: 1.2 },
  { id: "kitchen-2", categoryId: "kitchen", name: "Quartz Countertop", unit: "sqft", defaultPricing: "Turnkey", laborRate: 18, materialRate: 55, hoursPerUnit: 0.2 },
  { id: "kitchen-3", categoryId: "kitchen", name: "Backsplash Tile", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 12, materialRate: 8, hoursPerUnit: 0.25 },

  // Bath
  { id: "bath-1", categoryId: "bath", name: "Full Bath Remodel (Standard)", unit: "ea", defaultPricing: "Turnkey", laborRate: 8500, materialRate: 6500, hoursPerUnit: 80 },
  { id: "bath-2", categoryId: "bath", name: "Tile Shower Surround", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 18, materialRate: 12, hoursPerUnit: 0.35 },
  { id: "bath-3", categoryId: "bath", name: "Vanity Install (36\")", unit: "ea", defaultPricing: "Labor + Material", laborRate: 285, materialRate: 650, hoursPerUnit: 3 },

  // Door & Window
  { id: "doorwindow-1", categoryId: "doorwindow", name: "Interior Door (Prehung)", unit: "ea", defaultPricing: "Labor + Material", laborRate: 185, materialRate: 195, hoursPerUnit: 2 },
  { id: "doorwindow-2", categoryId: "doorwindow", name: "Vinyl Window Replacement", unit: "ea", defaultPricing: "Turnkey", laborRate: 285, materialRate: 425, hoursPerUnit: 3 },
  { id: "doorwindow-3", categoryId: "doorwindow", name: "Sliding Glass Door", unit: "ea", defaultPricing: "Turnkey", laborRate: 850, materialRate: 1450, hoursPerUnit: 8 },

  // Roof
  { id: "roof-1", categoryId: "roof", name: "Composition Shingle Reroof", unit: "sq", defaultPricing: "Turnkey", laborRate: 285, materialRate: 165, hoursPerUnit: 4 },
  { id: "roof-2", categoryId: "roof", name: "Gutter Install", unit: "lf", defaultPricing: "Labor + Material", laborRate: 6, materialRate: 5, hoursPerUnit: 0.15 },

  // Siding
  { id: "siding-1", categoryId: "siding", name: "Stucco Repair", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 8, materialRate: 3, hoursPerUnit: 0.15 },
  { id: "siding-2", categoryId: "siding", name: "Hardie Plank Siding", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 5.5, materialRate: 4.5, hoursPerUnit: 0.1 },

  // Concrete
  { id: "concrete-1", categoryId: "concrete", name: "Concrete Slab (4\")", unit: "sqft", defaultPricing: "Turnkey", laborRate: 7, materialRate: 5, hoursPerUnit: 0.15 },
  { id: "concrete-2", categoryId: "concrete", name: "Driveway Apron", unit: "sqft", defaultPricing: "Turnkey", laborRate: 9, materialRate: 6, hoursPerUnit: 0.18 },

  // Landscape
  { id: "landscape-1", categoryId: "landscape", name: "Sod Installation", unit: "sqft", defaultPricing: "Labor + Material", laborRate: 0.8, materialRate: 0.6, hoursPerUnit: 0.02 },
  { id: "landscape-2", categoryId: "landscape", name: "Drip Irrigation Zone", unit: "ea", defaultPricing: "Turnkey", laborRate: 350, materialRate: 220, hoursPerUnit: 4 },

  // Fence
  { id: "fence-1", categoryId: "fence", name: "Wood Privacy Fence (6')", unit: "lf", defaultPricing: "Labor + Material", laborRate: 22, materialRate: 18, hoursPerUnit: 0.5 },
  { id: "fence-2", categoryId: "fence", name: "Vinyl Fence", unit: "lf", defaultPricing: "Labor + Material", laborRate: 25, materialRate: 32, hoursPerUnit: 0.55 },

  // Deck
  { id: "deck-1", categoryId: "deck", name: "Composite Deck Build", unit: "sqft", defaultPricing: "Turnkey", laborRate: 28, materialRate: 22, hoursPerUnit: 0.6 },
  { id: "deck-2", categoryId: "deck", name: "Concrete Patio", unit: "sqft", defaultPricing: "Turnkey", laborRate: 8, materialRate: 6, hoursPerUnit: 0.15 },

  // ADU
  { id: "adu-1", categoryId: "adu", name: "Detached ADU (per sqft)", unit: "sqft", defaultPricing: "Turnkey", laborRate: 180, materialRate: 200, hoursPerUnit: 1.2 },
  { id: "adu-2", categoryId: "adu", name: "Garage Conversion ADU", unit: "sqft", defaultPricing: "Turnkey", laborRate: 140, materialRate: 160, hoursPerUnit: 0.9 },
];

// Attach Chinese names from the localized map
PRICE_ITEMS.forEach((i) => {
  i.nameZh = PRICE_ITEM_ZH[i.id] ?? i.name;
});



export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: string;
}

export const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "James Wilson", phone: "(415) 555-0142", email: "james@example.com", address: "284 Sunset Blvd", city: "San Francisco", state: "CA", zip: "94122", notes: "Kitchen remodel — wants quartz countertops", createdAt: "2026-05-12" },
  { id: "c2", name: "Maria Garcia", phone: "(408) 555-0193", email: "maria.g@example.com", address: "1290 Lincoln Ave", city: "San Jose", state: "CA", zip: "95125", notes: "Full bath + flooring", createdAt: "2026-05-21" },
  { id: "c3", name: "David Chen", phone: "(510) 555-0167", email: "dchen@example.com", address: "55 Telegraph Ave", city: "Oakland", state: "CA", zip: "94612", notes: "ADU garage conversion", createdAt: "2026-05-28" },
  { id: "c4", name: "Sarah Johnson", phone: "(650) 555-0118", email: "sj@example.com", address: "412 University Dr", city: "Palo Alto", state: "CA", zip: "94301", notes: "Whole-house paint", createdAt: "2026-06-01" },
];
