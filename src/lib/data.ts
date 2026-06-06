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
  { id: "lowvoltage", name: "Low Voltage", nameZh: "弱电工程", icon: "Cable" },
  { id: "general", name: "General Conditions", nameZh: "总包条件", icon: "ClipboardList" },
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

// ============================================================
// V2 Expansion — additional items appended to the seed library.
// Existing items above are untouched. Prices default to 0 with
// "Estimate" pricing type; edit per-item in the Price Book UI.
// ============================================================
const V2_ITEMS: Array<[string, string, string, string]> = [
  // [categoryId, name (EN), nameZh, unit]
  // Demolition
  ["demo", "Carpet Removal", "地毯拆除", "sqft"],
  ["demo", "Tile Removal", "瓷砖拆除", "sqft"],
  ["demo", "Stone Removal", "石材拆除", "sqft"],
  ["demo", "Cabinet Removal", "橱柜拆除", "lf"],
  ["demo", "Countertop Removal", "台面拆除", "lf"],
  ["demo", "Shower Removal", "淋浴间拆除", "ea"],
  ["demo", "Toilet Removal", "马桶拆除", "ea"],
  ["demo", "Vanity Removal", "浴室柜拆除", "ea"],
  ["demo", "Drywall Removal", "石膏板拆除", "sqft"],
  ["demo", "Ceiling Removal", "天花板拆除", "sqft"],
  ["demo", "Interior Wall Removal", "室内墙体拆除", "sqft"],
  ["demo", "Exterior Wall Removal", "外墙拆除", "sqft"],
  ["demo", "Door Removal", "门拆除", "ea"],
  ["demo", "Window Removal", "窗户拆除", "ea"],
  ["demo", "Dumpster Service", "垃圾箱服务", "job"],
  ["demo", "Site Protection", "现场保护", "job"],
  ["demo", "Debris Hauling", "垃圾清运", "job"],

  // Rough Carpentry
  ["framing", "Load Bearing Wall Support", "承重墙支撑", "job"],
  ["framing", "Beam Installation", "横梁安装", "ea"],
  ["framing", "Closet Framing", "壁橱框架", "ea"],
  ["framing", "Stair Framing", "楼梯框架", "job"],
  ["framing", "Garage Conversion Framing", "车库改建框架", "job"],
  ["framing", "ADU Framing", "ADU 框架", "job"],
  ["framing", "Roof Framing", "屋顶框架", "sqft"],
  ["framing", "Deck Framing", "露台框架", "sqft"],
  ["framing", "Pergola Framing", "凉亭框架", "job"],
  ["framing", "Window Framing", "窗户框架", "ea"],
  ["framing", "Door Framing", "门框架", "ea"],

  // Drywall
  ["drywall", "Drywall Patch", "石膏板修补", "ea"],
  ["drywall", "Moisture Resistant Drywall", "防潮石膏板", "sqft"],
  ["drywall", "Fire Rated Drywall", "防火石膏板", "sqft"],
  ["drywall", "Garage Drywall", "车库石膏板", "sqft"],
  ["drywall", "Smooth Finish", "光面处理", "sqft"],
  ["drywall", "Orange Peel Texture", "橘皮纹理", "sqft"],
  ["drywall", "Knockdown Texture", "拍打纹理", "sqft"],
  ["drywall", "Ceiling Repair", "天花板修补", "sqft"],
  ["drywall", "Soundproof Wall", "隔音墙", "sqft"],

  // Painting
  ["paint", "Ceiling Paint", "天花板油漆", "sqft"],
  ["paint", "Trim Paint", "线条油漆", "lf"],
  ["paint", "Door Paint", "门油漆", "ea"],
  ["paint", "Door Frame Paint", "门框油漆", "ea"],
  ["paint", "Cabinet Paint", "橱柜油漆", "ea"],
  ["paint", "Exterior Paint", "外墙油漆", "sqft"],
  ["paint", "Fence Paint", "围栏油漆", "lf"],
  ["paint", "Deck Paint", "露台油漆", "sqft"],
  ["paint", "Pressure Washing", "高压清洗", "sqft"],

  // Flooring
  ["flooring", "Laminate Installation", "强化复合地板安装", "sqft"],
  ["flooring", "Engineered Hardwood", "工程实木地板", "sqft"],
  ["flooring", "Stone Installation", "石材安装", "sqft"],
  ["flooring", "Carpet Installation", "地毯安装", "sqft"],
  ["flooring", "Moisture Barrier", "防潮层", "sqft"],
  ["flooring", "Sound Underlayment", "隔音垫层", "sqft"],
  ["flooring", "Transition Strip", "过渡条", "lf"],

  // Electrical
  ["electrical", "Standard Outlet", "标准插座", "ea"],
  ["electrical", "GFCI Outlet", "GFCI 插座", "ea"],
  ["electrical", "AFCI Breaker", "AFCI 断路器", "ea"],
  ["electrical", "Switch", "开关", "ea"],
  ["electrical", "Dimmer Switch", "调光开关", "ea"],
  ["electrical", "Pendant Light", "吊灯", "ea"],
  ["electrical", "Wall Sconce", "壁灯", "ea"],
  ["electrical", "Ceiling Fan", "吊扇", "ea"],
  ["electrical", "Bathroom Exhaust Fan", "浴室排气扇", "ea"],
  ["electrical", "Smoke Detector", "烟雾报警器", "ea"],
  ["electrical", "Carbon Monoxide Detector", "一氧化碳报警器", "ea"],
  ["electrical", "New Circuit", "新增电路", "ea"],
  ["electrical", "Sub Panel", "副电箱", "ea"],

  // Plumbing
  ["plumbing", "Faucet Installation", "水龙头安装", "ea"],
  ["plumbing", "Kitchen Sink", "厨房水槽", "ea"],
  ["plumbing", "Bathroom Sink", "浴室水槽", "ea"],
  ["plumbing", "Garbage Disposal", "厨余处理器", "ea"],
  ["plumbing", "Smart Toilet", "智能马桶", "ea"],
  ["plumbing", "Bathtub Installation", "浴缸安装", "ea"],
  ["plumbing", "Shower Enclosure", "淋浴房", "ea"],
  ["plumbing", "Tankless Water Heater", "无水箱热水器", "ea"],
  ["plumbing", "Copper Repipe", "铜管重铺", "job"],
  ["plumbing", "PEX Repipe", "PEX 管重铺", "job"],
  ["plumbing", "Drain Repair", "下水管维修", "job"],
  ["plumbing", "Water Filtration System", "净水系统", "ea"],

  // HVAC
  ["hvac", "Furnace Replacement", "暖炉更换", "ea"],
  ["hvac", "Central AC", "中央空调", "ea"],
  ["hvac", "Heat Pump", "热泵", "ea"],
  ["hvac", "Duct Installation", "风管安装", "lf"],
  ["hvac", "Duct Replacement", "风管更换", "lf"],
  ["hvac", "Smart Thermostat", "智能温控器", "ea"],
  ["hvac", "Attic Insulation", "阁楼保温", "sqft"],
  ["hvac", "Wall Insulation", "墙体保温", "sqft"],
  ["hvac", "Crawlspace Insulation", "地下空间保温", "sqft"],

  // Kitchen
  ["kitchen", "Semi Custom Cabinets", "半定制橱柜", "lf"],
  ["kitchen", "Custom Cabinets", "全定制橱柜", "lf"],
  ["kitchen", "Granite Countertop", "花岗岩台面", "sqft"],
  ["kitchen", "Marble Countertop", "大理石台面", "sqft"],
  ["kitchen", "Kitchen Island", "中岛", "ea"],
  ["kitchen", "Range Hood", "抽油烟机", "ea"],
  ["kitchen", "Dishwasher Installation", "洗碗机安装", "ea"],
  ["kitchen", "Oven Installation", "烤箱安装", "ea"],
  ["kitchen", "Refrigerator Hookup", "冰箱接通", "ea"],

  // Bathroom
  ["bath", "Double Vanity", "双盆浴室柜", "ea"],
  ["bath", "Mirror Installation", "镜子安装", "ea"],
  ["bath", "Medicine Cabinet", "药品柜", "ea"],
  ["bath", "Walk In Shower", "步入式淋浴", "ea"],
  ["bath", "Shower Pan", "淋浴盆底", "ea"],
  ["bath", "Glass Shower Door", "玻璃淋浴门", "ea"],
  ["bath", "Tile Wall", "瓷砖墙", "sqft"],
  ["bath", "Tile Floor", "瓷砖地板", "sqft"],
  ["bath", "Waterproofing", "防水处理", "sqft"],
  ["bath", "Niche", "壁龛", "ea"],

  // Doors & Windows
  ["doorwindow", "Solid Core Door", "实芯门", "ea"],
  ["doorwindow", "French Door", "法式门", "ea"],
  ["doorwindow", "Entry Door", "入户门", "ea"],
  ["doorwindow", "Fire Door", "防火门", "ea"],
  ["doorwindow", "Window Replacement", "窗户更换", "ea"],
  ["doorwindow", "Double Pane Window", "双层玻璃窗", "ea"],
  ["doorwindow", "Screen Installation", "纱窗安装", "ea"],

  // Roofing
  ["roof", "Tile Roof", "瓦片屋顶", "sq"],
  ["roof", "Metal Roof", "金属屋顶", "sq"],
  ["roof", "Flat Roof", "平屋顶", "sq"],
  ["roof", "Flashing", "泛水板", "lf"],
  ["roof", "Ridge Vent", "屋脊通风", "lf"],
  ["roof", "Skylight", "天窗", "ea"],

  // Siding & Exterior
  ["siding", "New Stucco", "新拉毛", "sqft"],
  ["siding", "Siding Installation", "外墙板安装", "sqft"],
  ["siding", "Fiber Cement Siding", "纤维水泥板", "sqft"],
  ["siding", "Exterior Waterproofing", "外墙防水", "sqft"],
  ["siding", "Fascia Repair", "封檐板修复", "lf"],
  ["siding", "Eave Repair", "屋檐修复", "lf"],

  // Concrete
  ["concrete", "Driveway", "车道", "sqft"],
  ["concrete", "Sidewalk", "人行道", "sqft"],
  ["concrete", "Patio Slab", "露台板", "sqft"],
  ["concrete", "Foundation Repair", "地基修复", "job"],
  ["concrete", "Garage Floor", "车库地坪", "sqft"],
  ["concrete", "Retaining Wall Footing", "挡土墙基础", "lf"],
  ["concrete", "Concrete Cutting", "混凝土切割", "lf"],
  ["concrete", "Concrete Demolition", "混凝土拆除", "sqft"],

  // Landscaping
  ["landscape", "Artificial Turf", "人造草坪", "sqft"],
  ["landscape", "Natural Sod", "天然草皮", "sqft"],
  ["landscape", "Irrigation System", "灌溉系统", "job"],
  ["landscape", "Pavers", "铺路砖", "sqft"],
  ["landscape", "Retaining Wall", "挡土墙", "sqft"],
  ["landscape", "Drainage System", "排水系统", "job"],
  ["landscape", "Landscape Lighting", "景观照明", "ea"],

  // Fence
  ["fence", "Redwood Fence", "红木围栏", "lf"],
  ["fence", "Pressure Treated Fence", "防腐木围栏", "lf"],
  ["fence", "Iron Fence", "铁艺围栏", "lf"],
  ["fence", "Side Gate", "侧门", "ea"],
  ["fence", "Automatic Gate", "自动门", "ea"],
  ["fence", "Fence Repair", "围栏维修", "job"],

  // Deck
  ["deck", "Wood Deck", "木质露台", "sqft"],
  ["deck", "Trex Deck", "Trex 露台", "sqft"],
  ["deck", "Deck Stairs", "露台台阶", "ea"],
  ["deck", "Deck Railing", "露台栏杆", "lf"],
  ["deck", "Pergola", "凉亭", "ea"],
  ["deck", "Outdoor Kitchen", "户外厨房", "job"],

  // ADU
  ["adu", "Permit Application", "许可证申请", "job"],
  ["adu", "Architectural Design", "建筑设计", "job"],
  ["adu", "Structural Engineering", "结构工程", "job"],
  ["adu", "Site Preparation", "场地准备", "job"],
  ["adu", "Foundation", "地基", "sqft"],
  ["adu", "Framing", "框架", "sqft"],
  ["adu", "Roofing", "屋顶", "sqft"],
  ["adu", "Electrical", "电气", "job"],
  ["adu", "Plumbing", "水暖", "job"],
  ["adu", "HVAC", "暖通", "job"],
  ["adu", "Insulation", "保温", "sqft"],
  ["adu", "Drywall", "石膏板", "sqft"],
  ["adu", "Flooring", "地板", "sqft"],
  ["adu", "Kitchen Package", "厨房套装", "job"],
  ["adu", "Bathroom Package", "卫浴套装", "job"],
  ["adu", "Final Inspection", "最终验收", "job"],

  // Low Voltage
  ["lowvoltage", "Security Camera", "安防摄像头", "ea"],
  ["lowvoltage", "NVR Installation", "NVR 安装", "ea"],
  ["lowvoltage", "Network Cable Cat6", "Cat6 网线", "lf"],
  ["lowvoltage", "Access Control", "门禁系统", "ea"],
  ["lowvoltage", "Doorbell Camera", "门铃摄像头", "ea"],
  ["lowvoltage", "WiFi Access Point", "WiFi 接入点", "ea"],
  ["lowvoltage", "Audio System", "音响系统", "job"],
  ["lowvoltage", "TV Mounting", "电视安装", "ea"],
  ["lowvoltage", "Smart Home System", "智能家居系统", "job"],

  // General Conditions
  ["general", "Permit Fee", "许可证费用", "job"],
  ["general", "Engineering Fee", "工程师费用", "job"],
  ["general", "Architectural Fee", "建筑师费用", "job"],
  ["general", "Project Management Fee", "项目管理费", "job"],
  ["general", "Site Protection", "现场保护", "job"],
  ["general", "Dumpster Rental", "垃圾箱租赁", "job"],
  ["general", "Final Cleaning", "最终清洁", "job"],
  ["general", "Change Order", "变更单", "job"],
  ["general", "Mobilization", "进场动员", "job"],
  ["general", "Inspection Coordination", "验收协调", "job"],
];

// Dedup against existing PRICE_ITEMS using categoryId + name + nameZh + unit
{
  const keyOf = (c: string, n: string, z: string, u: string) =>
    `${c}__${n.trim().toLowerCase()}__${z.trim().toLowerCase()}__${u.trim().toLowerCase()}`;
  const existing = new Set(
    PRICE_ITEMS.map((i) => keyOf(i.categoryId, i.name, i.nameZh ?? "", i.unit)),
  );
  let idx = 0;
  for (const [categoryId, name, nameZh, unit] of V2_ITEMS) {
    const k = keyOf(categoryId, name, nameZh, unit);
    if (existing.has(k)) continue;
    existing.add(k);
    PRICE_ITEMS.push({
      id: `v2-${categoryId}-${idx++}`,
      categoryId,
      name,
      nameZh,
      unit,
      defaultPricing: "Estimate",
      laborRate: 0,
      materialRate: 0,
      hoursPerUnit: 0,
    });
  }
}





export type CustomerSource =
  | "Website"
  | "Referral"
  | "Yelp"
  | "Google"
  | "Facebook"
  | "Walk-in"
  | "Other";

export const CUSTOMER_SOURCES: CustomerSource[] = [
  "Website",
  "Referral",
  "Yelp",
  "Google",
  "Facebook",
  "Walk-in",
  "Other",
];

export type CustomerFlagType = "VIP" | "Loyal" | "Referral" | "HighRisk" | "Custom";

export const CUSTOMER_FLAG_TYPES: CustomerFlagType[] = [
  "VIP",
  "Loyal",
  "Referral",
  "HighRisk",
  "Custom",
];

export interface CustomerFlag {
  type: CustomerFlagType;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  unit?: string;
  suite?: string;
  building?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  notes?: string;
  source?: CustomerSource;
  createdAt: string;
  flag?: CustomerFlag | null;
  isArchived?: boolean;
}

// Customers are business data — no seed records. Users add their own.
export const SEED_CUSTOMERS: Customer[] = [];
