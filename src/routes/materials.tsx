import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Pencil, Trash2, Eye, Mail, Phone, MapPin, Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useT, useLocale } from "@/lib/i18n";
import { useSuppliers, type Supplier } from "@/lib/supplier-store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Suppliers · Construction Hub" }] }),
  component: MaterialsPage,
});

type FormState = Omit<Supplier, "id" | "createdAt">;

const EMPTY_FORM: FormState = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  website: "",
  categoryEn: "",
  categoryZh: "",
  commonMaterials: "",
  paymentMethod: "",
  paymentTerms: "",
  account: "",
  notes: "",
};

function MaterialsPage() {
  const t = useT();
  const locale = useLocale();
  const suppliers = useSuppliers((s) => s.suppliers);
  const addSupplier = useSuppliers((s) => s.addSupplier);
  const updateSupplier = useSuppliers((s) => s.updateSupplier);
  const removeSupplier = useSuppliers((s) => s.removeSupplier);

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const L = locale === "zh"
    ? {
        addBtn: "+ 新增供货商",
        addTitle: "新增供货商",
        editTitle: "编辑供货商",
        save: "保存",
        cancel: "取消",
        view: "查看",
        edit: "编辑",
        del: "删除",
        confirmDel: "确定删除该供货商？",
        saved: "供货商保存成功",
        deleted: "供货商已删除",
        empty: "暂无供货商，点击右上角新增。",
        secTitle: "供货商",
        secSub: "供应商资料库 · 关联材料采购来源",
      }
    : {
        addBtn: "+ Add Supplier",
        addTitle: "Add Supplier",
        editTitle: "Edit Supplier",
        save: "Save",
        cancel: "Cancel",
        view: "View",
        edit: "Edit",
        del: "Delete",
        confirmDel: "Delete this supplier?",
        saved: "Supplier saved successfully",
        deleted: "Supplier removed",
        empty: "No suppliers yet. Click Add Supplier to get started.",
        secTitle: "Suppliers",
        secSub: "Supplier directory · linked to material sourcing",
      };

  const visible = useMemo(() => suppliers.filter((s) => !s.isArchived), [suppliers]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setAddOpen(true);
  };

  const openEdit = (s: Supplier) => {
    const { id: _id, createdAt: _c, ...rest } = s;
    setForm({ ...EMPTY_FORM, ...rest });
    setEditingId(s.id);
    setAddOpen(true);
  };

  const onSave = () => {
    if (!form.name.trim()) {
      toast.error(locale === "zh" ? "请输入供货商名称" : "Supplier name is required");
      return;
    }
    if (editingId) {
      updateSupplier(editingId, form);
    } else {
      addSupplier(form);
    }
    toast.success(L.saved);
    setAddOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const onDelete = (s: Supplier) => {
    if (!confirm(L.confirmDel)) return;
    removeSupplier(s.id);
    toast.success(L.deleted);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("mat.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("mat.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">{L.secTitle}</h2>
            <p className="text-xs text-muted-foreground">{L.secSub}</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {L.addBtn.replace("+ ", "")}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
            {L.empty}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((s) => (
              <div
                key={s.id}
                className="group rounded-lg border border-border bg-card p-5 shadow-panel transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-semibold">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {locale === "zh" ? s.categoryZh || s.categoryEn : s.categoryEn || s.categoryZh}
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <Package className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  {s.contactPerson && (
                    <div className="text-muted-foreground">
                      <span className="text-foreground">{s.contactPerson}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {s.phone}
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" /> <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {(s.city || s.state) && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[s.city, s.state, s.zip].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>

                {(s.account || s.paymentTerms) && (
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                    {s.account && (
                      <div>
                        <div className="text-muted-foreground">{t("mat.account")}</div>
                        <div className="font-mono">{s.account}</div>
                      </div>
                    )}
                    {s.paymentTerms && (
                      <div>
                        <div className="text-muted-foreground">{t("mat.terms")}</div>
                        <div>{s.paymentTerms}</div>
                      </div>
                    )}
                  </div>
                )}

                {s.notes && (
                  <div className="mt-3 line-clamp-2 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                    {s.notes}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                  <button
                    onClick={() => setViewing(s)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Eye className="h-3 w-3" /> {L.view}
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" /> {L.edit}
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> {L.del}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SupplierDialog
        open={addOpen}
        title={editingId ? L.editTitle : L.addTitle}
        form={form}
        setForm={setForm}
        onClose={() => {
          setAddOpen(false);
          setEditingId(null);
        }}
        onSave={onSave}
        saveLabel={L.save}
        cancelLabel={L.cancel}
        locale={locale}
      />

      <ViewDialog supplier={viewing} onClose={() => setViewing(null)} locale={locale} />
    </div>
  );
}

// ---------------- Dialogs ----------------

function SupplierDialog({
  open,
  title,
  form,
  setForm,
  onClose,
  onSave,
  saveLabel,
  cancelLabel,
  locale,
}: {
  open: boolean;
  title: string;
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
  cancelLabel: string;
  locale: "en" | "zh";
}) {
  const L = locale === "zh"
    ? {
        name: "供货商名称",
        contact: "联系人",
        phone: "电话",
        email: "Email",
        address: "地址",
        city: "城市",
        state: "州",
        zip: "ZIP",
        website: "网站",
        cat: "供应材料类别",
        common: "常用材料",
        method: "付款方式",
        terms: "账期",
        account: "账号",
        notes: "备注",
      }
    : {
        name: "Supplier Name",
        contact: "Contact Person",
        phone: "Phone",
        email: "Email",
        address: "Address",
        city: "City",
        state: "State",
        zip: "ZIP Code",
        website: "Website",
        cat: "Material Category",
        common: "Common Materials",
        method: "Payment Method",
        terms: "Payment Terms",
        account: "Account #",
        notes: "Notes",
      };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
   <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={L.name} required>
            <Input value={form.name} onChange={(v) => set("name", v)} />
          </Field>
          <Field label={L.contact}>
            <Input value={form.contactPerson ?? ""} onChange={(v) => set("contactPerson", v)} />
          </Field>
          <Field label={L.phone}>
            <Input value={form.phone ?? ""} onChange={(v) => set("phone", v)} />
          </Field>
          <Field label={L.email}>
            <Input value={form.email ?? ""} onChange={(v) => set("email", v)} />
          </Field>
          <Field label={L.address} full>
            <Input value={form.address ?? ""} onChange={(v) => set("address", v)} />
          </Field>
          <Field label={L.city}>
            <Input value={form.city ?? ""} onChange={(v) => set("city", v)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={L.state}>
              <Input value={form.state ?? ""} onChange={(v) => set("state", v)} />
            </Field>
            <Field label={L.zip}>
              <Input value={form.zip ?? ""} onChange={(v) => set("zip", v)} />
            </Field>
          </div>
          <Field label={L.website} full>
            <Input value={form.website ?? ""} onChange={(v) => set("website", v)} />
          </Field>
          <Field label={locale === "zh" ? "类别 (英文)" : "Category (EN)"}>
            <Input value={form.categoryEn ?? ""} onChange={(v) => set("categoryEn", v)} />
          </Field>
          <Field label={locale === "zh" ? "类别 (中文)" : "Category (中文)"}>
            <Input value={form.categoryZh ?? ""} onChange={(v) => set("categoryZh", v)} />
          </Field>
          <Field label={L.common} full>
            <Input value={form.commonMaterials ?? ""} onChange={(v) => set("commonMaterials", v)} />
          </Field>
          <Field label={L.method}>
            <Input value={form.paymentMethod ?? ""} onChange={(v) => set("paymentMethod", v)} />
          </Field>
          <Field label={L.terms}>
            <Input value={form.paymentTerms ?? ""} onChange={(v) => set("paymentTerms", v)} />
          </Field>
          <Field label={L.account}>
            <Input value={form.account ?? ""} onChange={(v) => set("account", v)} />
          </Field>
          <Field label={L.notes} full>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </Field>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSave}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            {saveLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({
  supplier,
  onClose,
  locale,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  locale: "en" | "zh";
}) {
  return (
    <Dialog open={!!supplier} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{supplier?.name}</DialogTitle>
        </DialogHeader>
        {supplier && (
          <div className="space-y-2 text-sm">
            {supplier.contactPerson && (
              <Line label={locale === "zh" ? "联系人" : "Contact"} value={supplier.contactPerson} />
            )}
            {supplier.phone && <Line label={locale === "zh" ? "电话" : "Phone"} value={supplier.phone} icon={<Phone className="h-3 w-3" />} />}
            {supplier.email && <Line label="Email" value={supplier.email} icon={<Mail className="h-3 w-3" />} />}
            {supplier.website && <Line label={locale === "zh" ? "网站" : "Website"} value={supplier.website} icon={<Globe className="h-3 w-3" />} />}
            {(supplier.address || supplier.city) && (
              <Line
                label={locale === "zh" ? "地址" : "Address"}
                value={[supplier.address, supplier.city, supplier.state, supplier.zip].filter(Boolean).join(", ")}
                icon={<MapPin className="h-3 w-3" />}
              />
            )}
            {(supplier.categoryEn || supplier.categoryZh) && (
              <Line
                label={locale === "zh" ? "类别" : "Category"}
                value={locale === "zh" ? supplier.categoryZh || supplier.categoryEn || "" : supplier.categoryEn || supplier.categoryZh || ""}
              />
            )}
            {supplier.commonMaterials && (
              <Line label={locale === "zh" ? "常用材料" : "Common Materials"} value={supplier.commonMaterials} />
            )}
            {supplier.paymentMethod && (
              <Line label={locale === "zh" ? "付款方式" : "Payment Method"} value={supplier.paymentMethod} />
            )}
            {supplier.paymentTerms && (
              <Line label={locale === "zh" ? "账期" : "Terms"} value={supplier.paymentTerms} />
            )}
            {supplier.account && <Line label={locale === "zh" ? "账号" : "Account"} value={supplier.account} />}
            {supplier.notes && (
              <div className="mt-2 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                {supplier.notes}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Line({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-24 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5 text-sm">
        {icon}
        {value}
      </div>
    </div>
  );
}

function Field({ label, children, full, required }: { label: string; children: React.ReactNode; full?: boolean; required?: boolean }) {
  return (
    <div className={"space-y-1.5 " + (full ? "sm:col-span-2" : "")}>
      <label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
    />
  );
}
