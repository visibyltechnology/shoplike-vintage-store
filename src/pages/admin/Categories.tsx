import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SECTIONS = ["male", "female", "children"];

interface CatForm { name: string; section: string; slug: string; imageUrl: string; }
const emptyForm: CatForm = { name: "", section: "male", slug: "", imageUrl: "" };

async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("section", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["sb-categories"],
    queryFn: fetchCategories,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sb-categories"] });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Category created" }); },
    onError: (e: any) => toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { error } = await supabase.from("categories").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Category updated" }); },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Category deleted" }); },
    onError: (e: any) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, section: c.section, slug: c.slug, imageUrl: c.image_url || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = () => {
    const payload = { name: form.name, section: form.section, slug: form.slug, image_url: form.imageUrl || null };
    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    deleteMutation.mutate(id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s] = categories.filter((c: any) => c.section === s);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground flex items-center gap-2" data-testid="button-new-category">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading categories…</p>}

      {SECTIONS.map((section) => (
        <div key={section}>
          <h2 className="font-semibold capitalize mb-3 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${section === "male" ? "bg-primary" : section === "female" ? "bg-accent" : "bg-secondary"}`} />
            {section} ({grouped[section]?.length || 0})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {grouped[section]?.map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between" data-testid={`card-category-${c.id}`}>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted" data-testid={`button-edit-category-${c.id}`}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" data-testid={`button-delete-category-${c.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold">{editId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded hover:bg-muted" data-testid="button-close-category-form"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-category-name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Section *</label>
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="select-category-section">
                  {SECTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-category-slug" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL (optional)</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-category">Cancel</Button>
              <Button onClick={handleSave} disabled={isPending || !form.name || !form.slug}
                className="bg-primary text-primary-foreground" data-testid="button-save-category">
                {isPending ? "Saving..." : editId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
