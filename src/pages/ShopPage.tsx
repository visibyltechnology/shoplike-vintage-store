import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useGetProducts, useGetCategories } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ShopPageProps {
  section?: string;
}

export default function ShopPage({ section }: ShopPageProps) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialSearch = params.get("search") || "";
  const initialSale = params.get("sale") === "true";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSection, setSelectedSection] = useState(section || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(initialSale);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const limit = 16;

  const { data: categories } = useGetCategories();

  const queryParams = {
    section: selectedSection || undefined,
    search: searchQuery || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
    inStock: inStockOnly ? true : undefined,
    page,
    limit,
  };

  const { data, isLoading } = useGetProducts(queryParams);

  const filteredProducts = data?.products?.filter((p) => !onSaleOnly || p.isOnSale) || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  const sectionLabel = section ? section.charAt(0).toUpperCase() + section.slice(1) : "All Products";
  const filteredCategories = categories?.filter((c) => !selectedSection || c.section === selectedSection) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">{sectionLabel}</h1>
          {data && <p className="text-muted-foreground text-sm mt-1">{data.total} products found</p>}
        </div>
        <Button
          variant="outline"
          className="md:hidden flex items-center gap-2"
          onClick={() => setFilterOpen(!filterOpen)}
          data-testid="button-toggle-filters"
        >
          <Filter size={16} />
          Filters
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${filterOpen ? "block" : "hidden"} md:block w-full md:w-64 shrink-0 space-y-6`}>
          <div className="bg-card border border-border rounded-xl p-5 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter size={16} /> Filters
                {(searchQuery || selectedCategory || selectedSection || inStockOnly || onSaleOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setSelectedSection(section || "");
                      setInStockOnly(false);
                      setOnSaleOnly(false);
                      setPriceRange([0, 200000]);
                    }}
                    className="ml-auto text-xs text-accent hover:underline"
                    data-testid="button-clear-filters"
                  >
                    Clear all
                  </button>
                )}
              </h3>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-filter-search"
              />
            </div>

            {/* Section */}
            {!section && (
              <div>
                <label className="text-sm font-medium mb-2 block">Section</label>
                <div className="space-y-1">
                  {["", "male", "female", "children"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSection(s); setSelectedCategory(""); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedSection === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      data-testid={`button-section-${s || "all"}`}
                    >
                      {s === "" ? "All Sections" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {filteredCategories.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    data-testid="button-category-all"
                  >
                    All Categories
                  </button>
                  {filteredCategories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      data-testid={`button-category-${c.slug}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range: ₦{priceRange[0].toLocaleString()} – ₦{priceRange[1].toLocaleString()}
              </label>
              <Slider
                min={0}
                max={200000}
                step={1000}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="mt-2"
                data-testid="slider-price-range"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-border"
                  data-testid="checkbox-in-stock"
                />
                In Stock Only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => setOnSaleOnly(e.target.checked)}
                  className="rounded border-border"
                  data-testid="checkbox-on-sale"
                />
                On Sale Only
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl font-serif text-muted-foreground mb-2">No products found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
