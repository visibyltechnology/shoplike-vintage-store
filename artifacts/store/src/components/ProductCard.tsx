import { Link } from "wouter";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  comparePrice?: number | null;
  images?: string[] | null;
  section: string;
  categoryName?: string | null;
  isOnSale: boolean;
  isFeatured: boolean;
  inStock: boolean;
  rating?: number | null;
  reviewCount?: number | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const imageUrl = product.images?.[0] || null;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;
  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      imageUrl: imageUrl,
    });
    toast({ title: "Added to cart", description: product.name });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    toast({
      title: wishlisted ? "Removed from wishlist" : "Saved to wishlist",
      description: product.name,
    });
  };

  return (
    <Link href={`/product/${product.id}`} data-testid={`card-product-${product.id}`}>
      <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              data-testid={`img-product-${product.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-4xl font-serif">SV</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isOnSale && discount && (
              <Badge className="bg-accent text-accent-foreground text-xs">-{discount}%</Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-secondary text-secondary-foreground text-xs">Featured</Badge>
            )}
            {!product.inStock && (
              <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
            )}
          </div>

          {/* Wishlist heart — always visible */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-all duration-200 ${
              wishlisted
                ? "bg-rose-500 text-white"
                : "bg-white/90 dark:bg-gray-900/90 text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
            }`}
            data-testid={`button-wishlist-${product.id}`}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={14} className={wishlisted ? "fill-white" : ""} />
          </button>

          {/* Add to cart — visible on hover */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/90 disabled:opacity-50 shadow-md"
            data-testid={`button-add-cart-${product.id}`}
            title="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>

        <div className="p-3">
          {product.categoryName && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{product.categoryName}</p>
          )}
          <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          {product.rating != null && product.reviewCount != null && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="fill-secondary text-secondary" />
              <span className="text-xs text-muted-foreground">{Number(product.rating).toFixed(1)} ({product.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>
                ₦{product.price.toLocaleString()}
              </span>
              {product.comparePrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₦{product.comparePrice.toLocaleString()}
                </span>
              )}
            </div>
            {/* Quick add-to-cart button always visible on mobile */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="md:hidden shrink-0 bg-primary text-primary-foreground p-1.5 rounded-full disabled:opacity-40"
              title="Add to cart"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
