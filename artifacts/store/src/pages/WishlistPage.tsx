import { Link } from "wouter";
import { Heart, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function WishlistPage() {
  const { items, removeItem, clear } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({ productId: item.id, name: item.name, price: item.price, qty: 1, imageUrl: item.images?.[0] ?? null });
    toast({ title: "Added to cart", description: item.name });
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      if (item.inStock) {
        addItem({ productId: item.id, name: item.name, price: item.price, qty: 1, imageUrl: item.images?.[0] ?? null });
      }
    });
    clear();
    toast({ title: "All items added to cart!" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
            <Heart size={24} className="text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Wishlist</h1>
            <p className="text-muted-foreground text-sm">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clear} className="flex items-center gap-1.5 text-muted-foreground">
              <Trash2 size={14} /> Clear All
            </Button>
            <Button size="sm" onClick={handleMoveAllToCart} className="flex items-center gap-1.5">
              <ShoppingCart size={14} /> Add All to Cart
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart size={64} className="mx-auto mb-6 opacity-20" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-sm mb-6">Save items you love by tapping the heart icon on any product.</p>
          <Link href="/shop">
            <Button className="gap-2">
              <ShoppingBag size={18} /> Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const imageUrl = item.images?.[0] || null;
            const discount = item.comparePrice
              ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
              : null;
            return (
              <div key={item.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
                <Link href={`/product/${item.id}`}>
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground text-3xl font-serif">SV</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.isOnSale && discount && (
                        <Badge className="bg-accent text-accent-foreground text-xs">-{discount}%</Badge>
                      )}
                      {!item.inStock && (
                        <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.id); }}
                      className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-full shadow hover:bg-rose-50 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Heart size={16} className="text-rose-500 fill-rose-500" />
                    </button>
                  </div>
                </Link>
                <div className="p-3">
                  {item.categoryName && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.categoryName}</p>
                  )}
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-primary text-sm">₦{item.price.toLocaleString()}</span>
                    {item.comparePrice && (
                      <span className="text-xs text-muted-foreground line-through">₦{item.comparePrice.toLocaleString()}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    disabled={!item.inStock}
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart size={14} />
                    {item.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
