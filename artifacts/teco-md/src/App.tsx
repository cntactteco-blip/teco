import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useRoute, useLocation } from "wouter";
import { initSession, trackPage, getSessionPayload } from "@/lib/session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/contexts/LangContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CartDrawer } from "@/components/CartDrawer";
import { SocialProof } from "@/components/SocialProof";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContact } from "@/components/FloatingContact";
import { TecoBot } from "@/components/TecoBot";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";

import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Products from "@/pages/Products";
import Services from "@/pages/Services";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/not-found";
import { ComparatorDrawer } from "@/components/ComparatorDrawer";
import Termeni from "@/pages/Termeni";
import Confidentialitate from "@/pages/Confidentialitate";
import Garantii from "@/pages/Garantii";
import Livrare from "@/pages/Livrare";
const Admin = lazy(() => import("@/pages/Admin"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const RequestQuote = lazy(() => import("@/pages/RequestQuote"));
const B2B = lazy(() => import("@/pages/B2B"));
const ServiceCity = lazy(() => import("@/pages/ServiceCity"));

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

const API = typeof import.meta !== "undefined" ? (import.meta.env.VITE_API_URL || "") : "";

function SessionTracker() {
  const [location] = useLocation();

  // Inițializează sesiunea și trimite notificarea de vizitator nou (o singură dată)
  useEffect(() => {
    initSession().then((session) => {
      trackPage(window.location.pathname, document.title);
      fetch(API + "/api/notify/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: getSessionPayload() }),
      }).catch(() => {});
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trackează fiecare schimbare de pagină
  useEffect(() => {
    trackPage(location, document.title);
  }, [location]);

  return null;
}

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ShopRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/produse" component={Products} />
        <Route path="/seturi-camere-supraveghere" component={Products} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/servicii" component={Services} />
        <Route path="/servicii/:city" component={ServiceCity} />
        <Route path="/b2b" component={B2B} />
        <Route path="/favorit" component={Wishlist} />
        <Route path="/oferta" component={RequestQuote} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/termeni" component={Termeni} />
        <Route path="/confidentialitate" component={Confidentialitate} />
        <Route path="/garantii" component={Garantii} />
        <Route path="/livrare" component={Livrare} />
        <Route path="/checkout" component={Checkout} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ShopShell() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <ScrollToTop />
      <SessionTracker />
      <AnnouncementBar />
      <Header />
      <ShopRoutes />
      <Footer />
      <CartDrawer />
      <ComparatorDrawer />
      <SocialProof />
      <BottomNav />
      <FloatingContact />
      <TecoBot />
      <ExitIntentPopup />
    </div>
  );
}

function AppRouter() {
  const [isAdmin] = useRoute("/admin");
  if (isAdmin) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Admin />
      </Suspense>
    );
  }
  return <ShopShell />;
}

function App() {
  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
}

export default App;
