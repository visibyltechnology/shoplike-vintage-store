import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { setAuthTokenGetter } from "@/lib/api-client";
import { getAdminToken, isAdminLoggedIn } from "@/lib/api";

import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import CustomerAuthPage from "@/pages/CustomerAuthPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AccountPage from "@/pages/AccountPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminCategories from "@/pages/admin/Categories";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUsers from "@/pages/admin/Users";
import AdminPayments from "@/pages/admin/Payments";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

setAuthTokenGetter(() => getAdminToken());

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } },
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) { window.location.replace("/admin"); return null; }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><Layout><HomePage /></Layout></Route>
      <Route path="/shop"><Layout><ShopPage /></Layout></Route>
      <Route path="/shop/male"><Layout><ShopPage section="male" /></Layout></Route>
      <Route path="/shop/female"><Layout><ShopPage section="female" /></Layout></Route>
      <Route path="/shop/children"><Layout><ShopPage section="children" /></Layout></Route>
      <Route path="/product/:id"><Layout><ProductPage /></Layout></Route>
      <Route path="/cart"><Layout><CartPage /></Layout></Route>
      <Route path="/checkout"><Layout><CheckoutPage /></Layout></Route>
      <Route path="/order-success/:ref"><Layout><OrderSuccessPage /></Layout></Route>
      <Route path="/track-order"><Layout><TrackOrderPage /></Layout></Route>
      <Route path="/wishlist"><Layout><WishlistPage /></Layout></Route>
      <Route path="/login"><Layout><CustomerAuthPage mode="login" /></Layout></Route>
      <Route path="/signup"><Layout><CustomerAuthPage mode="signup" /></Layout></Route>
      <Route path="/forgot-password"><Layout><ForgotPasswordPage /></Layout></Route>
      <Route path="/reset-password"><Layout><ResetPasswordPage /></Layout></Route>
      <Route path="/account"><Layout><AccountPage /></Layout></Route>
      <Route path="/admin"><AdminLogin /></Route>
      <Route path="/admin/dashboard"><AdminGuard><AdminLayout><Dashboard /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/products"><AdminGuard><AdminLayout><AdminProducts /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/orders"><AdminGuard><AdminLayout><AdminOrders /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/categories"><AdminGuard><AdminLayout><AdminCategories /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/users"><AdminGuard><AdminLayout><AdminUsers /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/payments"><AdminGuard><AdminLayout><AdminPayments /></AdminLayout></AdminGuard></Route>
      <Route path="/admin/settings"><AdminGuard><AdminLayout><AdminSettings /></AdminLayout></AdminGuard></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="sv-theme">
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <WouterRouter>
                <Router />
              </WouterRouter>
              <Toaster />
              <PWAInstallPrompt />
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
