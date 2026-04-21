import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLang } from "@/i18n/LanguageContext";
import { useGetHuntItems, type HuntItemWithStatus } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Hunt from "@/pages/hunt";
import Camera from "@/pages/camera";
import Rankings from "@/pages/rankings";
import Friends from "@/pages/friends";
import Profile from "@/pages/profile";
import { Target, Trophy, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;
  return <Component />;
}

function HuntBadge() {
  const { user } = useAuth();
  const { data: items } = useGetHuntItems();
  if (!user) return null;
  const remaining = items ? items.filter((i: HuntItemWithStatus) => !i.found).length : 0;
  if (remaining === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 min-w-[20px] h-[20px] px-1 gradient-secondary text-white border-2 border-background font-mono text-[10px] font-bold flex items-center justify-center rounded-full shadow-md">
      {remaining}
    </span>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLang();

  if (location === "/auth" || location.startsWith("/camera")) {
    return <>{children}</>;
  }

  const navItems = [
    { path: "/hunt", icon: Target, label: t("nav.hunt"), badge: true },
    { path: "/rankings", icon: Trophy, label: t("nav.ranks"), badge: false },
    { path: "/friends", icon: Users, label: t("nav.crew"), badge: false },
  ];

  return (
    <div className="min-h-[100dvh] text-foreground flex flex-col max-w-[480px] mx-auto relative">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex justify-between items-center gap-2 border-b border-border/50">
        <Link href="/hunt" className="flex items-center gap-2 shrink-0 group">
          <span className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center font-bold text-primary-foreground shadow-md group-hover:scale-110 transition-transform">iF</span>
          <span className="text-base font-bold tracking-tight text-gradient-primary">iFinder</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Avatar className="h-9 w-9 rounded-full border-2 border-primary/60 cursor-pointer hover:border-primary hover:scale-105 transition-all">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-card text-primary font-semibold text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || "ME"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass border-t border-border/50 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full transition-all relative ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${item.path.slice(1)}`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? "scale-110" : ""}`} />
                  {item.badge && <HuntBadge />}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                {isActive && <div className="absolute -top-px left-1/3 right-1/3 h-1 rounded-full gradient-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading) setLocation(user ? "/hunt" : "/auth");
  }, [isLoading, user, setLocation]);

  return <div className="min-h-[100dvh] bg-background" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth" component={Auth} />
      <Route path="/hunt"><ProtectedRoute component={Hunt} /></Route>
      <Route path="/camera/:itemId"><ProtectedRoute component={Camera} /></Route>
      <Route path="/rankings"><ProtectedRoute component={Rankings} /></Route>
      <Route path="/friends"><ProtectedRoute component={Friends} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppShell>
                <Router />
              </AppShell>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
