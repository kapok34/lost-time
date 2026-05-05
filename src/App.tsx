import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/i18n/context";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Apply from "./pages/Apply.tsx";
import Pending from "./pages/Pending.tsx";
import Members from "./pages/Members.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import Messages from "./pages/Messages.tsx";
import Conversation from "./pages/Conversation.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/pending" element={<RequireAuth><Pending /></RequireAuth>} />
            <Route path="/members" element={<RequireAuth requireApproved><Members /></RequireAuth>} />
            <Route path="/members/:id" element={<RequireAuth requireApproved><Profile /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth requireApproved><Settings /></RequireAuth>} />
            <Route path="/messages" element={<RequireAuth requireApproved><Messages /></RequireAuth>} />
            <Route path="/messages/:id" element={<RequireAuth requireApproved><Conversation /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth requireAdmin><Admin /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </I18nProvider>
  </QueryClientProvider>
);

export default App;
