import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_TERMS_EN = `1. Scope of Work
This estimate includes only the work specifically listed in this proposal. Any additional work requested by the owner after acceptance shall be considered a Change Order and may result in additional charges.

2. Material Availability & Pricing
Material prices and availability are subject to change without notice. Final pricing may be adjusted if supplier costs increase before project commencement.

3. Unforeseen Conditions
This estimate is based on visible site conditions only. Hidden conditions discovered during construction — including but not limited to water damage, mold, dry rot, termite damage, structural deficiencies, plumbing issues, electrical code violations, or other concealed conditions — may require additional labor and materials and will be billed separately.

4. Permits & Inspections
Permit fees, engineering fees, architectural fees, HOA fees, and government inspection fees are not included unless specifically stated in this estimate.

5. Schedule
Project schedules are estimates only. Contractor shall not be responsible for delays caused by weather, material shortages, inspections, utility companies, labor availability, acts of God, or circumstances beyond Contractor's control.

6. Payment Terms
Unless otherwise stated:
• Deposit: 30%
• Progress Payment: 40%
• Final Payment: 30%
Final payment is due immediately upon substantial completion of work.

7. Estimate Validity
This estimate is valid for 30 days from the date issued. Prices may be revised after expiration.

8. Limitation of Liability
Contractor shall not be liable for indirect, incidental, special, or consequential damages arising from this project. Contractor's liability shall be limited to the value of this estimate.

9. Acceptance
Acceptance of this estimate authorizes Contractor to perform the work described herein subject to the terms and conditions stated above.`;

export const DEFAULT_TERMS_ZH = `1. 工程范围
本报价仅包含本提案中明确列出的施工项目。客户在签字接受后追加的任何工作均视为变更单（Change Order），并可能产生额外费用。

2. 材料价格与供应
材料价格及供应情况可能随时变动，恕不另行通知。如供应商在工程开工前调价，最终价格可能相应调整。

3. 隐蔽工程条件
本报价基于现场可见条件作出。施工过程中如发现隐蔽问题，包括但不限于水渍损坏、霉变、干腐、白蚁损害、结构缺陷、水管问题、电气违章等，将另行计价。

4. 许可证与检验
除非报价中另有说明，许可证费、工程师费、建筑师费、HOA 费用及政府检验费均不包含在本报价内。

5. 工期
工期仅供参考。因天气、材料短缺、政府检验、市政公用单位、人工调度、不可抗力及其他承包商无法控制的原因造成的延误，承包商不承担责任。

6. 付款方式
除非另有约定：
• 定金：30%
• 进度款：40%
• 尾款：30%
工程实质完工后，尾款应立即支付。

7. 报价有效期
本报价自签发日起 30 天内有效，逾期价格可能调整。

8. 责任限制
承包商不对本工程所产生的间接、附带、特殊或后果性损失承担责任。承包商责任以本报价金额为上限。

9. 接受条款
客户签字接受本报价即授权承包商按上述条款执行本报价所述工程。`;

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
    { name: "construction-hub-terms" },
  ),
);
