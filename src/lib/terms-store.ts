import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_TERMS_EN = `1. Scope of Work
Only the work specifically listed in this estimate is included. Any additional work requested by the customer will be treated as a change order and may result in additional charges.

2. Material Prices and Availability
Material prices and availability are subject to change without notice. Final pricing may be adjusted if supplier costs increase before the project starts.

3. Hidden or Unforeseen Conditions
This estimate is based on visible conditions only. Hidden conditions discovered during construction — including but not limited to dry rot, termite damage, water damage, mold, outdated wiring, plumbing issues, or structural defects — may require additional work and additional charges.

4. Permits and Inspections
Permit fees, engineering fees, design fees, and government inspection fees are not included unless specifically stated in this estimate.

5. Project Schedule
Project schedule may be affected by weather, material delays, inspections, labor availability, or other circumstances beyond the contractor's control.

6. Customer Supplied Materials
For customer-supplied materials, the contractor is not responsible for product defects, missing parts, delays, wrong sizes, color differences, warranty issues, or return/exchange problems.

7. Estimate Validity
This estimate is valid for 30 days from the date issued unless otherwise stated.

8. Payment Terms
Payment schedule and deposit requirements will be agreed upon before work begins. Final payment is due upon project completion unless otherwise stated in writing.

9. Change Orders
Any work not included in this estimate must be approved as a written change order before work proceeds.

10. Acceptance
Customer signature or written approval indicates acceptance of this estimate, including the scope of work, pricing, and terms listed herein.`;

export const DEFAULT_TERMS_ZH = `1. 施工范围
本报价单仅包含明确列出的施工项目。客户后续要求增加的施工内容，将作为变更项目处理，并可能产生额外费用。

2. 材料价格与供应
材料价格和库存可能随时变化。如项目开工前供应商价格上涨或材料缺货，最终价格可能需要调整。

3. 隐藏问题与不可预见情况
本报价基于现场可见情况。施工过程中如发现隐藏问题，包括但不限于木腐、白蚁损坏、漏水、霉菌、旧电线不符合规范、水管问题或结构缺陷，可能需要额外施工并产生额外费用。

4. 许可证与检查
除非报价单中明确列出，Permit 费用、工程师费用、设计费用和政府检查费用不包含在本报价内。

5. 施工进度
施工进度可能受到天气、材料延迟、政府检查、人工安排或其他承包商无法控制的因素影响。

6. 客户自购材料
如客户自行购买材料，承包商不负责材料质量问题、缺少配件、送货延迟、尺寸错误、颜色差异、保修问题或退换货问题。

7. 报价有效期
本报价自开具日起 30 天内有效，除非另有说明。

8. 付款条款
开工前双方需确认付款计划和订金要求。除非另有书面约定，工程完成后客户应支付尾款。

9. 变更项目
凡不包含在本报价单内的施工内容，必须以书面变更单形式确认后方可施工。

10. 接受报价
客户签字或书面确认即表示接受本报价单中的施工范围、价格和相关条款。`;

export interface TermsState {
  termsEn: string;
  termsZh: string;
  setTerms: (patch: Partial<Pick<TermsState, "termsEn" | "termsZh">>) => void;
  resetDefaults: () => void;
}

export const useTerms = create<TermsState>()(
  persist(
    (set) => ({
      termsEn: DEFAULT_TERMS_EN,
      termsZh: DEFAULT_TERMS_ZH,
      setTerms: (patch) => set((s) => ({ ...s, ...patch })),
      resetDefaults: () =>
        set({ termsEn: DEFAULT_TERMS_EN, termsZh: DEFAULT_TERMS_ZH }),
    }),
    { name: "construction-hub-terms.v2" },
  ),
);
