"use client";

import { createElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ICON_REGISTRY, resolveIcon } from "@/components/category-icon";
import { useCategories } from "@/components/categories/categories-provider";
import {
  CATEGORY_COLORS,
  FALLBACK_CATEGORY_ID,
  type Category,
  type CategoryKind,
} from "@/lib/categories";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  restoreDefaultCategories,
} from "@/lib/actions/categories";
import { Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_OPTIONS: { value: CategoryKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "both", label: "Both" },
];

export function CategoryManager() {
  const categories = useCategories();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  return (
    <Card className="translucent-surface border-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Defaults are included. Add, rename, recolor or remove them to fit how you spend.
          </CardDescription>
        </div>
        <CategoryEditor
          onSaved={refresh}
          trigger={
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-1">
        {categories.map((c) => {
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklch, ${c.color} 18%, transparent)` }}
              >
                {createElement(resolveIcon(c.icon), { className: "h-4 w-4", style: { color: c.color } })}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.label}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {c.kind === "both" ? "Income & expense" : c.kind}
                  {c.isDefault ? " · default" : ""}
                </p>
              </div>
              <CategoryEditor
                category={c}
                onSaved={refresh}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={`Edit ${c.label}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              {c.id !== FALLBACK_CATEGORY_ID && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${c.label}`}
                  disabled={pending}
                  onClick={() => {
                    if (
                      !confirm(
                        `Delete "${c.label}"? Its transactions will move to Others and its budget limit will be removed.`
                      )
                    )
                      return;
                    startTransition(async () => {
                      const res = await deleteCategory(c.id);
                      if (!res.success) alert(res.error);
                      refresh();
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await restoreDefaultCategories();
                refresh();
              })
            }
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Restore missing defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryEditor({
  category,
  trigger,
  onSaved,
}: {
  category?: Category;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const isFallback = category?.id === FALLBACK_CATEGORY_ID;

  return (
    <ResponsiveModal
      title={isEdit ? "Edit category" : "New category"}
      description={
        isEdit ? "Renaming updates all existing transactions too." : "Pick a name, icon and color."
      }
      trigger={trigger}
    >
      {(close) => (
        <EditorForm
          category={category}
          isFallback={isFallback}
          onDone={() => {
            close();
            onSaved();
          }}
        />
      )}
    </ResponsiveModal>
  );
}

function EditorForm({
  category,
  isFallback,
  onDone,
}: {
  category?: Category;
  isFallback: boolean;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(category?.label ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "Receipt");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "expense");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    const input = { label, icon, color, kind };
    const res = category ? await updateCategory(category.id, input) : await createCategory(input);
    if (res.success) onDone();
    else {
      setError(res.error);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Name</Label>
        <Input
          id="cat-name"
          value={label}
          maxLength={30}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Pet care"
        />
      </div>

      {!isFallback && (
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="flex gap-2">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  kind === k.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label="Pick color"
              onClick={() => setColor(c)}
              className={cn(
                "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition",
                color === c && "ring-2 ring-primary"
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Icon</Label>
        <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto pr-1">
          {Object.entries(ICON_REGISTRY)
            .filter(([name]) => name !== "Home")
            .map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                aria-label={name}
                onClick={() => setIcon(name)}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg transition-colors",
                  icon === name ? "bg-primary/15 ring-2 ring-primary" : "bg-muted/50 hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </button>
            ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="h-11 w-full rounded-xl" disabled={saving || !label.trim()} onClick={save}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isFallback || category ? "Save" : "Create"}
      </Button>
    </div>
  );
}
