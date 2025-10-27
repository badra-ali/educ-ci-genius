import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import ListeCours from "./pages/ListeCours";
import CoursDetail from "./pages/CoursDetail";
import PasserQcm from "./pages/PasserQcm";
import CreerCours from "./pages/CreerCours";
import DevoirDetail from "./pages/DevoirDetail";
import Suivi from "./pages/Suivi";
import Bibliotheque from "./pages/Bibliotheque";
import TuteurIA from "./pages/TuteurIA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classe" element={<ListeCours />} />
          <Route path="/classe/:id" element={<CoursDetail />} />
          <Route path="/cours/new" element={<CreerCours />} />
          <Route path="/qcm/:id/passer" element={<PasserQcm />} />
          <Route path="/devoir/:id" element={<DevoirDetail />} />
          <Route path="/suivi" element={<Suivi />} />
          <Route path="/bibliotheque" element={<Bibliotheque />} />
          <Route path="/tuteur-ia" element={<TuteurIA />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
