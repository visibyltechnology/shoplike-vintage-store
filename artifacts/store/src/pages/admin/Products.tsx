import { useState, useRef } from "react";
import {
  useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useGetCategories, useUploadImage, useUploadVideo,
  getGetProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload, X, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SECTIONS = ["male", "female", "children"];

interface ProductForm {
  name: string; description: string; price: string; comparePrice: string;
  section: string; categoryId: string; inStock: boolean; stockQty: string;
  sizes: string; colors: string; isFeatured: boolean; isOnSale: boolean;
  images: string[]; videoUrl: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", comparePrice: "", section: "male",
  categoryId: "", inStock: true, stockQty: "0", sizes: "", colors: "",
  isFeatured: false, isOnSale: false, images: [], videoUrl: "",
};

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [sectionFilter, setSectionFilter] = useState("");
  const { data, isLoading } = useGetProducts({ section: sectionFilter || undefined, page, limit: 20 });
  const { data: categories } = useGetCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadImage();
  const uploadVideo = useUploadVideo();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetProductsQueryKey() });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      section: p.section, categoryId: p.categoryId ? String(p.categoryId) : "",
      inStock: p.inStock, stockQty: String(p.stockQty || 0),
      sizes: Array.isArray(p.sizes) ? p.sizes.join(", ") : "",
      colors: Array.isArray(p.colors) ? p.colors.join(", ") : "",
      isFeatured: p.isFeatured, isOnSale: p.isOnSale,
      images: Array.isArray(p.images) ? p.images : [],
      videoUrl: p.videoUrl || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    uploadImage.mutate(formData as any, {
      onSuccess: (data: any) => {
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
        setUploadingImage(false);
        toast({ title: "Image uploaded" });
      },
      onError: () => { setUploadingImage(false); toast({ title: "Upload failed", variant: "destructive" }); },
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("file", file);
    uploadVideo.mutate(formData as any, {
      onSuccess: (data: any) => {
        setForm((f) => ({ ...f, videoUrl: data.url }));
        setUploadingVideo(false);
        toast({ title: "Video uploaded" });
      },
      onError: () => { setUploadingVideo(false); toast({ title: "Video upload failed", variant: "destructive" }); },
    });
  };

  const handleSave = () => {
    const payload = {
      name: form.name, description: form.description || null,
      price: parseFloat(form.price), comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      section: form.section, categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      inStock: form.inStock, stockQty: parseInt(form.stockQty) || 0,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
      isFeatured: form.isFeatured, isOnSale: form.isOnSale,
      images: form.images, videoUrl: form.videoUrl || null,
    };
    if (editId) {
      updateProduct.mutate({ id: editId, data: payload }, {
        onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product created" }); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Product deleted" }); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{data?.total || 0} total products</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground flex items-center gap-2" data-testid="button-new-product">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", ...SECTIONS].map((s) => (
          <button
            key={s}
            onClick={() => { setSectionFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sectionFilter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            data-testid={`button-filter-${s || "all"}`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Section</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><Skeleton className="h-12 w-full" /></td></tr>
                ))
                : data?.products?.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-product-${p.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">SV</div>}
                          {p.videoUrl && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center" title="Has video">
                              <Video size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          {p.videoUrl && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">VIDEO</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell capitalize">{p.section}</td>
                    <td className="px-4 py-3 font-semibold text-primary">₦{Number(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{p.stockQty ?? 0}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.inStock ? "In Stock" : "Out"}</span>
                        {p.isFeatured && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground w-fit font-medium">Featured</span>}
                        {p.isOnSale && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent w-fit font-medium">Sale</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors" data-testid={`button-edit-product-${p.id}`} title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors" data-testid={`button-delete-product-${p.id}`} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-products">Previous</Button>
            <span className="flex items-center text-sm px-2">Page {page} of {Math.ceil(data.total / 20)}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 20)} data-testid="button-next-products">Next</Button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded hover:bg-muted" data-testid="button-close-product-form"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Product Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-name" />
              </div>
              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" data-testid="input-product-description" />
              </div>
              {/* Price + Compare Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price (₦) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required min="0"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-price" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Compare Price (₦)</label>
                  <input type="number" value={form.comparePrice} onChange={(e) => setForm({...form, comparePrice: e.target.value})} min="0"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-compare-price" />
                </div>
              </div>
              {/* Section + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Section *</label>
                  <select value={form.section} onChange={(e) => setForm({...form, section: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="select-product-section">
                    {SECTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="select-product-category">
                    <option value="">None</option>
                    {categories?.filter(c => c.section === form.section).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock Quantity</label>
                  <input type="number" value={form.stockQty} onChange={(e) => setForm({...form, stockQty: e.target.value})} min="0"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-stock" />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} data-testid="checkbox-in-stock" />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({...form, isFeatured: e.target.checked})} data-testid="checkbox-featured" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isOnSale} onChange={(e) => setForm({...form, isOnSale: e.target.checked})} data-testid="checkbox-on-sale" />
                    On Sale
                  </label>
                </div>
              </div>
              {/* Sizes + Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Sizes (comma-separated)</label>
                  <input value={form.sizes} onChange={(e) => setForm({...form, sizes: e.target.value})} placeholder="S, M, L, XL"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-sizes" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Colors (comma-separated)</label>
                  <input value={form.colors} onChange={(e) => setForm({...form, colors: e.target.value})} placeholder="Red, Blue, Green"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" data-testid="input-product-colors" />
                </div>
              </div>
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Product Images (JPG/PNG)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"
                        data-testid={`button-remove-image-${i}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <input ref={imageInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleImageUpload} data-testid="input-image-file" />
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                  className="flex items-center gap-2" data-testid="button-upload-image">
                  <Image size={16} /> {uploadingImage ? "Uploading..." : "Upload Image"}
                </Button>
              </div>
              {/* Video Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Product Video (optional — MP4/MOV)</label>
                {form.videoUrl && (
                  <div className="flex items-center gap-2 mb-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    <Video size={16} className="text-primary" />
                    <span className="truncate flex-1 text-xs">{form.videoUrl}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, videoUrl: "" }))} data-testid="button-remove-video"><X size={14} /></button>
                  </div>
                )}
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} data-testid="input-video-file" />
                <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}
                  className="flex items-center gap-2" data-testid="button-upload-video">
                  <Video size={16} /> {uploadingVideo ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-product">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={createProduct.isPending || updateProduct.isPending || !form.name || !form.price}
                className="bg-primary text-primary-foreground"
                data-testid="button-save-product"
              >
                {createProduct.isPending || updateProduct.isPending ? "Saving..." : editId ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
