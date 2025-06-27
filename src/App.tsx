
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import MasterDataRoutes from "@/routes/MasterDataRoutes";
import AdminRoutes from "@/routes/AdminRoutes";
import OrderManagementRoutes from "@/routes/OrderManagementRoutes";
import InventoryRoutes from "@/routes/InventoryRoutes";
import { FinanceRoutes } from "@/routes/FinanceRoutes";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/master-data/*" element={<MainLayout><MasterDataRoutes /></MainLayout>} />
                <Route path="/admin/*" element={<MainLayout><AdminRoutes /></MainLayout>} />
                <Route path="/order-management/*" element={<MainLayout><OrderManagementRoutes /></MainLayout>} />
                <Route path="/inventory/*" element={<MainLayout><InventoryRoutes /></MainLayout>} />
                <Route path="/finance/*" element={<MainLayout><FinanceRoutes /></MainLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
