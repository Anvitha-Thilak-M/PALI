import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import DoctorDashboard from "./pages/dashboard/DoctorDashboard";
import PatientDashboard from "./pages/dashboard/PatientDashboard";
import CaregiverDashboard from "./pages/dashboard/CaregiverDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/patient" element={
              <ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/caregiver" element={
              <ProtectedRoute allowedRoles={['caregiver']}><CaregiverDashboard /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
