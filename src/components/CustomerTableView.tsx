import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreHorizontal,
  Crown,
  AlertTriangle,
  Gem,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Customer, CustomerFlagType } from "@/lib/data";
import {
  statusBadgeClass,
  statusLabel,
  type Project,
} from "@/lib/project-store";

export type CustomerTableRow = {
  c: Customer;
  projects: Project[];
  latest?: Project;
  estTotal: number;
  contractTotal: number;
  due: number;
};

function fmt$(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function flagLabel(type: CustomerFlagType, locale: "en" | "zh"): string {
  const map: Record<CustomerFlagType, { en: string; zh: string }> = {
    VIP: { en: "VIP", zh: "VIP" },
    Loyal: { en: "Loyal", zh: "老客户" },
    Referral: { en: "Referral", zh: "推荐" },
    HighRisk: { en: "High Risk", zh: "高风险" },
    Custom: { en: "Custom", zh: "自定义" },
  };
  return map[type][locale];
}

function flagBadgeClass(type: CustomerFlagType): string {
  switch (type) {
    case "VIP":
      return "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.16_75)]";
    case "Loyal":
      return "bg-[oklch(0.94_0.06_200)] text-[oklch(0.40_0.14_220)]";
    case "Referral":
      return "bg-[oklch(0.94_0.06_150)] text-[oklch(0.40_0.14_150)]";
    case "HighRisk":
      return "bg-[oklch(0.95_0.08_25)] text-[oklch(0.48_0.18_25)]";
    case "Custom":
      return "bg-secondary text-foreground";
  }
}

function FlagIcon({ type, className }: { type: CustomerFlagType; className?: string }) {
  if (type === "VIP") return <Crown className={className} />;
  if (type === "HighRisk") return <AlertTriangle className={className} />;
  if (type === "Loyal") return <Gem className={className} />;
  return <Star className={className} />;
}

export interface CustomerTableViewProps {
  rows: CustomerTableRow[];
  locale: "en" | "zh";
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPage: (p: number) => void;
  onSelect: (c: Customer) => void;
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onNewEstimate: (c: Customer) => void;
  onFlag: (c: Customer) => void;
  onToggleArchive: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

export function CustomerTableView({
  rows,
  locale,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPage,
  onSelect,
  onView,
  onEdit,
  onNewEstimate,
  onFlag,
  onToggleArchive,
  onDelete,
}: CustomerTableViewProps) {
  const L = locale === "zh"
    ? {
        name: "客户",
        city: "城市",
        status: "状态",
        quote: "报价金额",
        contract: "合同金额",
        due: "待收款",
        actions: "操作",
        empty: "暂无客户",
        view: "查看详情",
        edit: "编辑客户",
        newEst: "新建报价单",
        flag: "特别标记",
        archive: "归档",
        unarchive: "取消归档",
        del: "删除客户",
        archived: "已归档",
      }
    : {
        name: "Customer",
        city: "City",
        status: "Status",
        quote: "Estimated",
        contract: "Contracted",
        due: "Outstanding",
        actions: "Actions",
        empty: "No customers",
        view: "View Detail",
        edit: "Edit Customer",
        newEst: "New Estimate",
        flag: "Flag",
        archive: "Archive",
        unarchive: "Unarchive",
        del: "Delete",
        archived: "Archived",
      };

  return (
    <div className="rounded-xl border border-border bg-card shadow-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{L.name}</th>
              <th className="px-3 py-2.5 font-semibold">{L.city}</th>
              <th className="px-3 py-2.5 font-semibold">{L.status}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{L.quote}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{L.contract}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{L.due}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{L.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {L.empty}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const c = row.c;
              return (
                <ContextMenu key={c.id}>
                  <ContextMenuTrigger asChild>
                    <tr
                      onClick={() => onSelect(c)}
                      onDoubleClick={() => onView(c)}
                      className={
                        "group cursor-default border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/40 " +
                        (c.isArchived ? "opacity-60" : "")
                      }
                    >
                      {/* Name + phone + flag */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{c.name}</span>
                          {c.flag && (
                            <span
                              title={c.flag.note || flagLabel(c.flag.type, locale)}
                              className={
                                "inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium " +
                                flagBadgeClass(c.flag.type)
                              }
                            >
                              <FlagIcon type={c.flag.type} className="h-3 w-3" />
                              {flagLabel(c.flag.type, locale)}
                            </span>
                          )}
                          {c.isArchived && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {L.archived}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {c.phone || "—"}
                        </div>
                      </td>
                      {/* City */}
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {c.city || "—"}
                        {c.state ? `, ${c.state}` : ""}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3">
                        {row.latest ? (
                          <span
                            className={
                              "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium " +
                              statusBadgeClass(row.latest.status)
                            }
                          >
                            {statusLabel(row.latest.status, locale)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Estimate total */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-sm">
                        {row.estTotal > 0 ? fmt$(row.estTotal) : <span className="text-muted-foreground">—</span>}
                      </td>
                      {/* Contract total */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-sm">
                        {row.contractTotal > 0 ? fmt$(row.contractTotal) : <span className="text-muted-foreground">—</span>}
                      </td>
                      {/* Due */}
                      <td className="px-3 py-3 text-right">
                        {row.due > 0 ? (
                          <span className="font-mono tabular-nums text-sm font-semibold text-[oklch(0.48_0.16_50)]">
                            {fmt$(row.due)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onView(c);
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-input bg-card px-2 text-[11px] font-medium hover:bg-secondary"
                          >
                            <FileText className="h-3 w-3" /> {L.view}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onSelect={() => onEdit(c)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> {L.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onNewEstimate(c)}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> {L.newEst}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => onFlag(c)}>
                                <Star className="mr-2 h-3.5 w-3.5" /> {L.flag}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onToggleArchive(c)}>
                                {c.isArchived ? (
                                  <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                                ) : (
                                  <Archive className="mr-2 h-3.5 w-3.5" />
                                )}
                                {c.isArchived ? L.unarchive : L.archive}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => onDelete(c)}
                                className="text-[oklch(0.48_0.18_25)] focus:text-[oklch(0.48_0.18_25)]"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> {L.del}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-52">
                    <ContextMenuItem onSelect={() => onView(c)}>
                      <FileText className="mr-2 h-4 w-4" /> {L.view}
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => onEdit(c)}>
                      <Pencil className="mr-2 h-4 w-4" /> {L.edit}
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => onNewEstimate(c)}>
                      <Plus className="mr-2 h-4 w-4" /> {L.newEst}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => onFlag(c)}>
                      <Star className="mr-2 h-4 w-4" /> {L.flag}
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => onToggleArchive(c)}>
                      {c.isArchived ? (
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {c.isArchived ? L.unarchive : L.archive}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onSelect={() => onDelete(c)}
                      className="text-[oklch(0.48_0.18_25)] focus:text-[oklch(0.48_0.18_25)]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> {L.del}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2.5 text-xs">
        <span className="text-muted-foreground tabular-nums">
          {totalCount === 0
            ? "0"
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCount)} / ${totalCount}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPage(currentPage - 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-card text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPage(currentPage + 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-card text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
