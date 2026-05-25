import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SECTIONS = ["male", "female", "children"];
const PAGE_SIZE = 12;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png"];

interface ProductForm {
  name: string; description: string; price: string; compare_price: string;
  section: string; category: string; in_stock: boolean; stock_qty: string;
  sizes: string; colors: string; is_featured: boolean; is_on_sale: boolean;
  images: string[]; video_url: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", compare_price: "", section: "male",
  category: "", in_stock: true, stock_qty: "0", sizes: "", colors: "",
  is_featured: false, is_on_sale: false, images: [], video_url: "",
};

async function fetchProducts(section: string, page: number) {
  let q = supabase.from("products").select("*", { count: "exact" });
  if (section) q = q.eq("section", section);
  const from = (page - 1) * PAGE_SIZE;
  q = q.range(from, from + PAGE_SIZE - 1).order("created_at", { ascending: false });
  const { data, error, count } = await q;
  if (error) throw error;
  return { products: data || [], total: count || 0 };
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [sectionFilter, setSectionFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["sb-admin-products", sectionFilter, page];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchProducts(sectionFilter, page),
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sb-admin-products"] });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product created" }); },
    onError: (e: any) => toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product updated" }); },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setConfirmDelete(null); toast({ title: "Product deleted" }); },
    onError: (e: any) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name || "", description: p.description || "",
      price: String(p.price || ""), compare_price: p.compare_price ? String(p.compare_price) : "",
      section: p.section || "male", category: p.category || "",
      in_stock: p.in_stock !== false, stock_qty: String(p.stock_qty || 0),
      sizes: Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.sizes || ""),
      colors: Array.isArray(p.colors) ? p.colors.join(", ") : (p.colors || ""),
      is_featured: !!p.is_featured, is_on_sale: !!p.is_on_sale,
      images: Array.isArray(p.images) ? p.images : [],
      video_url: p.video_url || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG and PNG images are allowed.", variant: "destructive" });
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(`.${ext}`)) {
      toast({ title: "Invalid file type", description: "Only .jpg, .jpeg, and .png files are allowed.", variant: "destructive" });
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("product-images").upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(data.path);
      setForm(f => ({ ...f, images: [...f.images, publicUrl] }));
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const buildPayload = () => ({
    name: form.name,
    description: form.description || null,
    price: parseFloat(form.price) || 0,
    compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
    section: form.section,
    category: form.category || null,
    in_stock: form.in_stock,
    stock_qty: parseInt(form.stock_qty) || 0,
    sizes: form.sizes.split(",").map(s => s.trim()).filter(Boolean),
    colors: form.colors.split(",").map(s => s.trim()).filter(Boolean),
    is_featured: form.is_featured,
    is_on_sale: form.is_on_sale,
    images: form.images,
    video_url: form.video_url || null,
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!form.price) { toast({ title: "Price is required", variant: "destructive" }); return; }
    const payload = buildPayload();
    if (editId) updateMutation.mutate({ id: editId, payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{total} product{total !== 1 ? "s" : ""} in store</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={sectionFilter}
          onChange={e => { setSectionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="text-lg font-medium mb-2">No products found</p>
          <p className="text-sm">Add your first product using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.section} · {p.category || "—"}</p>
                <p className="text-sm font-bold text-primary mt-1">₦{Number(p.price).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {p.is_featured && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Featured</span>}
                  {p.is_on_sale && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-medium">Sale</span>}
                  {!p.in_stock && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Out of stock</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Button>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">Delete Product?</h3>
            <p className="text-muted-foreground text-sm mb-6">This cannot be undone. The product will be removed from the store.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(confirmDelete!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-serif font-bold">{editId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-md hover:bg-muted transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Classic Navy Blazer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className={inputCls + " resize-none"} placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price (₦) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="e.g. 15000" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Compare Price (₦)</label>
                  <input type="number" value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} className={inputCls} placeholder="Original price" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Section</label>
                  <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className={inputCls}>
                    {SECTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls} placeholder="e.g. Shirts, Dresses" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Sizes (comma-separated)</label>
                  <input value={form.sizes} onChange={e => setForm(f => ({ ...f, sizes: e.target.value }))} className={inputCls} placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Colors (comma-separated)</label>
                  <input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} className={inputCls} placeholder="Black, White, Navy" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock Quantity</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex flex-col gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm">In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_on_sale} onChange={e => setForm(f => ({ ...f, is_on_sale: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm">On Sale</span>
                  </label>
                </div>
              </div>

              {/* Product Images — upload only, JPG/PNG only */}
              <div>
                <label className="text-sm font-medium mb-2 block">Product Images</label>
                <p className="text-xs text-muted-foreground mb-2">Accepted formats: JPG, JPEG, PNG</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2"
                  >
                    <Upload size={14} /> {uploadingImage ? "Uploading…" : "Upload Image (JPG/PNG)"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Video URL (optional)</label>
                <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : editId ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
