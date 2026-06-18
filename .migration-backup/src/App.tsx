import { Switch, Route, Router as WouterRouter, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/contexts/LangContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Products from "@/pages/Products";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CartDrawer } from "@/components/CartDrawer";
import { SocialProof } from "@/components/SocialProof";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContact } from "@/components/FloatingContact";

const queryClient = new QueryClient();

function ShopRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produse" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ShopShell() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <AnnouncementBar />
      <Header />
      <ShopRoutes />
      <Footer />
      <CartDrawer />
      <SocialProof />
      <BottomNav />
      <FloatingContact />
    </div>
  );
}

function AppRouter() {
  const [isAdmin] = useRoute("/admin");
  if (isAdmin) return <Admin />;
  return <ShopShell />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LangProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </LangProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
