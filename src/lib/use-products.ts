import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface SupabaseProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  section: string;
  category: string | null;
  inStock: boolean;
  stockQty: number;
  sizes: string[];
  colors: string[];
  isFeatured: boolean;
  isOnSale: boolean;
  images: string[];
  videoUrl: string | null;
  createdAt: string;
}

function mapRow(p: any): SupabaseProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    comparePrice: p.compare_price ? Number(p.compare_price) : null,
    section: p.section,
    category: p.category ?? null,
    inStock: p.in_stock,
    stockQty: p.stock_qty ?? 0,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    isFeatured: p.is_featured,
    isOnSale: p.is_on_sale,
    images: Array.isArray(p.images) ? p.images : [],
    videoUrl: p.video_url ?? null,
    createdAt: p.created_at,
  };
}

interface ProductQuery {
  section?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sale?: boolean;
  page?: number;
  limit?: number;
}

export function useProducts(opts: ProductQuery = {}) {
  return useQuery({
    queryKey: ["sb-products", opts],
    queryFn: async () => {
      let q = supabase.from("products").select("*", { count: "exact" });
      if (opts.section) q = q.eq("section", opts.section);
      if (opts.featured) q = q.eq("is_featured", true);
      if (opts.sale) q = q.eq("is_on_sale", true);
      if (opts.inStock) q = q.eq("in_stock", true);
      if (opts.search) q = q.ilike("name", `%${opts.search}%`);
      if (opts.minPrice != null) q = q.gte("price", opts.minPrice);
      if (opts.maxPrice != null) q = q.lte("price", opts.maxPrice);
      const limit = opts.limit ?? 20;
      const page = opts.page ?? 1;
      q = q.range((page - 1) * limit, page * limit - 1).order("created_at", { ascending: false });
      const { data, error, count } = await q;
      if (error) throw error;
      return { products: (data ?? []).map(mapRow), total: count ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["sb-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["sb-product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return mapRow(data);
    },
    enabled: id != null,
    staleTime: 1000 * 60 * 5,
  });
}
