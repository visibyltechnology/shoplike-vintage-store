import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-serif font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Browse our collections and find something you love.</p>
        <Link href="/shop">
          <Button className="bg-primary text-primary-foreground" data-testid="button-continue-shopping">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-6">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item, i) => (
            <div
              key={`${item.productId}-${item.size}-${item.color}`}
              className="bg-card border border-border rounded-xl p-4 flex gap-4"
              data-testid={`cart-item-${item.productId}`}
            >
              <div className="w-20 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif">SV</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" data-testid={`text-cart-name-${item.productId}`}>{item.name}</h3>
                <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
                <p className="text-primary font-bold" data-testid={`text-cart-price-${item.productId}`}>
                  ₦{item.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => updateQty(item.productId, item.qty - 1, item.size, item.color)}
                      className="px-2 py-1 hover:bg-muted"
                      data-testid={`button-cart-dec-${item.productId}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium" data-testid={`text-cart-qty-${item.productId}`}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.qty + 1, item.size, item.color)}
                      className="px-2 py-1 hover:bg-muted"
                      data-testid={`button-cart-inc-${item.productId}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    = ₦{(item.price * item.qty).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="ml-auto text-destructive hover:bg-destructive/10 p-1 rounded"
                    data-testid={`button-cart-remove-${item.productId}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={clearCart}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            data-testid="button-clear-cart"
          >
            Clear cart
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 h-fit space-y-4">
          <h3 className="font-semibold text-lg">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span className="font-medium" data-testid="text-cart-subtotal">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-green-600 font-medium">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary" data-testid="text-cart-total">₦{total.toLocaleString()}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full bg-primary text-primary-foreground" data-testid="button-checkout">
              Proceed to Checkout
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="w-full" data-testid="button-continue-shopping-cart">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
