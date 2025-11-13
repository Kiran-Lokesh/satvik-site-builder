import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import Cart from "./components/Cart";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/NotFound";
import { getCurrentDataSource, getEnvironment } from "./lib/config";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Log the initial data source when app starts
console.log(`🚀 App starting with data source: ${getCurrentDataSource().toUpperCase()}`);
console.log(`🌍 Environment: ${getEnvironment().toUpperCase()}`);

const App = () => {
  const env = getEnvironment();
  
  // Apply environment class to body
  useEffect(() => {
    document.body.classList.add(`env-${env}`);
    
    return () => {
      document.body.classList.remove(`env-${env}`);
    };
  }, [env]);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        {/* Environment indicator - only show for local and test */}
        {env !== 'prod' && (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            zIndex: 9999,
            padding: '8px 16px',
            backgroundColor: env === 'local' ? '#3b82f6' : '#eab308',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            borderBottomLeftRadius: '8px'
          }}>
            ENV: {env.toUpperCase()}
          </div>
        )}
        <Toaster />
        <Sonner />
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Cart />
          </Layout>
        </HashRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
