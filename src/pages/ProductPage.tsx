import { useState } from "react";
import { useParams } from "wouter";
import { Star, ShoppingCart, MessageCircle, Play } from "lucide-react";
import { useProduct } from "@/lib/use-products";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { resolveUrl } from "@/lib/api-url";

interface LocalReview {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0") || null;
  const { data: product, isLoading } = useProduct(productId);
  const { addItem } = useCart();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-muted-foreground">Product not found</div>;
  }

  const images = (product.images ?? []).map(u => resolveUrl(u) ?? u);
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
      size: selectedSize || null,
      color: selectedColor || null,
      imageUrl: images[0] ?? null,
    });
    toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    setSubmittingReview(true);
    setTimeout(() => {
      setReviews((prev) => [
        {
          id: Date.now(),
          reviewerName,
          rating: reviewRating,
          comment: reviewComment,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setReviewerName("");
      setReviewComment("");
      setReviewRating(5);
      setSubmittingReview(false);
      toast({ title: "Review submitted", description: "Thank you for your review!" });
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
            {images.length > 0 ? (
              videoPlaying && product.videoUrl ? (
                <video src={product.videoUrl} controls autoPlay className="w-full h-full object-cover" />
              ) : (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-6xl font-serif">SV</span>
              </div>
            )}
            {product.videoUrl && !videoPlaying && (
              <button
                onClick={() => setVideoPlaying(true)}
                className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
                data-testid="button-play-video"
              >
                <Play size={16} /> Watch Video
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedImage(i); setVideoPlaying(false); }}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent"}`}
                  data-testid={`button-thumb-${i}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-serif font-bold mb-3" data-testid="text-product-name">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
              ₦{product.price.toLocaleString()}
            </span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ₦{product.comparePrice.toLocaleString()}
                </span>
                <Badge className="bg-accent text-accent-foreground">-{discount}% OFF</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground mb-5 leading-relaxed">{product.description}</p>
          )}

          {/* Sizes */}
          {(product.sizes?.length ?? 0) > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Size {selectedSize && <span className="text-muted-foreground font-normal">— {selectedSize}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selectedSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                    data-testid={`button-size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {(product.colors?.length ?? 0) > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Color {selectedColor && <span className="text-muted-foreground font-normal">— {selectedColor}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors!.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selectedColor === color ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                    data-testid={`button-color-${color}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to cart */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted" data-testid="button-qty-dec">-</button>
              <span className="px-4 py-2 font-medium" data-testid="text-qty">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 hover:bg-muted" data-testid="button-qty-inc">+</button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 flex items-center gap-2 bg-primary text-primary-foreground"
              data-testid="button-add-to-cart"
            >
              <ShoppingCart size={18} />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>

          <a
            href={`https://wa.me/2349063172596?text=I'm interested in ${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full flex items-center justify-center gap-2 border border-green-500 text-green-600 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
            data-testid="link-whatsapp-product"
          >
            <MessageCircle size={16} /> Enquire on WhatsApp
          </a>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Section: <span className="font-medium capitalize">{product.section}</span></p>
            {product.stockQty != null && product.inStock && (
              <p>In stock: <span className="font-medium">{product.stockQty} units</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-serif font-bold mb-6">Customer Reviews</h2>
        {reviews.length === 0 && (
          <p className="text-muted-foreground mb-6">No reviews yet. Be the first to review!</p>
        )}
        <div className="space-y-4 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{r.reviewerName}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? "fill-secondary text-secondary" : "text-muted-foreground"} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <p className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Your Name</label>
              <input
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-reviewer-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setReviewRating(i + 1)} data-testid={`button-rating-${i + 1}`}>
                    <Star size={24} className={i < reviewRating ? "fill-secondary text-secondary" : "text-muted-foreground"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Comment (optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                data-testid="input-review-comment"
              />
            </div>
            <Button type="submit" disabled={submittingReview} className="bg-primary text-primary-foreground" data-testid="button-submit-review">
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
