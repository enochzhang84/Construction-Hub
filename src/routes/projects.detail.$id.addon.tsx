import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/lib/i18n";
import { useProjects, type ProjectLineItem } from "@/lib/project-store";
import { CATEGORIES } from "@/lib/data";
import { tCategory } from "@/lib/i18n";

export const Route = createFileRoute("/projects/detail/$id/addon")({
  component: AddonPage,
});

type DraftLine = Omit<ProjectLineItem, "id" | "amount">;

const emptyLine: DraftLine = {
  categoryName: "",
  name: "",
  qty: 1,
  unit: "ea",
  unitPrice: 0,
};

function AddonPage() {
  const { id } = useParams({ from: "/projects/detail/$id/addon" });
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const navigate = useNavigate();
  const projects = useProjects((s) => s.projects);
  const add = useProjects((s) => s.add);
  const parent = projects.find((p) => p.id === id);

  const [lines, setLines] = useState<DraftLine[]>([{ ...emptyLine }]);
  const [notes, setNotes] = useState("");

  if (!parent) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        {isZh ? "未找到原工程" : "Parent project not found"}
      </div>
    );
  }

  const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const childCount = projects.filter((p) => p.parentProjectId === id).length;
  const addonNumber = `${parent.estimateNumber}-A${String(childCount + 1).padStart(2, "0")}`;

  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((s) => s.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((s) => s.filter((_, idx) => idx !== i));

  const onSave = () => {
    const validLines: ProjectLineItem[] = lines
      .filter((l) => l.name.trim())
      .map((l) => ({
        ...l,
        id: crypto.randomUUID(),
        amount: l.qty * l.unitPrice,
      }));
    if (validLines.length === 0) {
      toast.error(isZh ? "请至少添加一项" : "Add at least one line item");
      return;
    }
    add({
      customerName: parent.customerName,
      customerPhone: parent.customerPhone,
      projectAddress: parent.projectAddress,
      estimateNumber: addonNumber,
      addonNumber,
      parentProjectId: parent.id,
      amount: totalAmount,
      paidAmount: 0,
      estimateDate: new Date().toISOString().slice(0, 10),
      issueDate: new Date().toISOString().slice(0, 10),
      status: "Estimate",
      subStatus: "Draft",
      lineItems: validLines,
      notes,
    });
    toast.success(isZh ? "新增施工项目已保存" : "Add-on saved");
    navigate({ to: "/projects/detail/$id", params: { id: parent.id } });
  };

  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <Link
          to="/projects/detail/$id"
          params={{ id: parent.id }}
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("proj.back")}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("proj.addonHeading")}</h1>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
          <div><span className="font-medium text-foreground">{isZh ? "原客户：" : "Customer: "}</span>{parent.customerName}</div>
          <div><span className="font-medium text-foreground">{isZh ? "原地址：" : "Address: "}</span>{parent.projectAddress}</div>
          <div><span className="font-medium text-foreground">{isZh ? "原工程：" : "Project #: "}</span>{parent.estimateNumber}</div>
          <div><span className="font-medium text-foreground">{isZh ? "新增编号：" : "Add-on #: "}</span><span className="font-mono">{addonNumber}</span></div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">{t("proj.lineItems")}</h2>
            <button
              onClick={() => setLines((s) => [...s, { ...emptyLine }])}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" /> {t("proj.addonForm.addLine")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-1.5 font-medium">{t("pb.col.trade")}</th>
                  <th className="py-1.5 font-medium">{t("proj.addonForm.item")}</th>
                  <th className="py-1.5 font-medium">{t("proj.addonForm.qty")}</th>
                  <th className="py-1.5 font-medium">{t("proj.addonForm.unit")}</th>
                  <th className="py-1.5 font-medium">{t("proj.addonForm.price")}</th>
                  <th className="py-1.5 text-right font-medium">{isZh ? "金额" : "Amount"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="py-2 pr-2">
                      <select
                        value={l.categoryName || ""}
                        onChange={(e) => updateLine(i, { categoryName: e.target.value })}
                        className="w-32 rounded-md border border-input bg-card px-2 py-1 text-xs"
                      >
                        <option value="">—</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={tCategory(c, locale)}>
                            {tCategory(c, locale)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={l.name}
                        onChange={(e) => updateLine(i, { name: e.target.value })}
                        placeholder={isZh ? "项目名称" : "Item name"}
                        className="w-full rounded-md border border-input bg-card px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        value={l.qty}
                        onChange={(e) => updateLine(i, { qty: Number(e.target.value) || 0 })}
                        className="w-20 rounded-md border border-input bg-card px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={l.unit}
                        onChange={(e) => updateLine(i, { unit: e.target.value })}
                        className="w-16 rounded-md border border-input bg-card px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        value={l.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })}
                        className="w-24 rounded-md border border-input bg-card px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 text-right font-mono text-sm">
                      ${(l.qty * l.unitPrice).toLocaleString()}
                    </td>
                    <td className="py-2 pl-2">
                      {lines.length > 1 && (
                        <button
                          onClick={() => removeLine(i)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={5} className="py-3 text-right text-sm font-medium">
                    {isZh ? "合计" : "Total"}
                  </td>
                  <td className="py-3 text-right font-mono text-base font-semibold">
                    ${totalAmount.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("proj.addonForm.notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link
            to="/projects/detail/$id"
            params={{ id: parent.id }}
            className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {t("common.cancel")}
          </Link>
          <button
            onClick={onSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("proj.addonForm.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
