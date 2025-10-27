import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGate } from "@/components/auth/RoleGate";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Install from "./pages/Install";
import ListeCours from "./pages/ListeCours";
import CoursDetail from "./pages/CoursDetail";
import CreerCours from "./pages/CreerCours";
import CreerQcm from "./pages/CreerQcm";
import PasserQcm from "./pages/PasserQcm";
import DevoirDetail from "./pages/DevoirDetail";
import CorrigerDevoir from "./pages/CorrigerDevoir";
import Forum from "./pages/Forum";
import Suivi from "./pages/Suivi";
import Bibliotheque from "./pages/Bibliotheque";
import { ResourceReader } from "./components/library/ResourceReader";
import TuteurIA from "./pages/TuteurIA";
import NotFound from "./pages/NotFound";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            
            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classe"
              element={
                <ProtectedRoute>
                  <ListeCours />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classe/:id"
              element={
                <ProtectedRoute>
                  <CoursDetail />
                </ProtectedRoute>
              }
            />
            
            {/* Enseignant-only routes */}
            <Route
              path="/cours/new"
              element={
                <ProtectedRoute>
                  <RoleGate allowedRoles={["ENSEIGNANT", "ADMIN_ECOLE", "ADMIN_SYSTEME"]}>
                    <CreerCours />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/qcm/new"
              element={
                <ProtectedRoute>
                  <RoleGate allowedRoles={["ENSEIGNANT", "ADMIN_ECOLE", "ADMIN_SYSTEME"]}>
                    <CreerQcm />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/devoir/:id/corriger"
              element={
                <ProtectedRoute>
                  <RoleGate allowedRoles={["ENSEIGNANT", "ADMIN_ECOLE", "ADMIN_SYSTEME"]}>
                    <CorrigerDevoir />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            
            {/* Student/Teacher routes */}
            <Route
              path="/qcm/:id/passer"
              element={
                <ProtectedRoute>
                  <PasserQcm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devoir/:id"
              element={
                <ProtectedRoute>
                  <DevoirDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/:coursId"
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suivi"
              element={
                <ProtectedRoute>
                  <Suivi />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bibliotheque"
              element={
                <ProtectedRoute>
                  <Bibliotheque />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bibliotheque/:id"
              element={
                <ProtectedRoute>
                  <ResourceReader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tuteur-ia"
              element={
                <ProtectedRoute>
                  <TuteurIA />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
