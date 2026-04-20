import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Hunt from "@/pages/hunt";
import Camera from "@/pages/camera";
import Rankings from "@/pages/rankings";
import Friends from "@/pages/friends";
import Profile from "@/pages/profile";
import { Target, Camera as CameraIcon, Trophy, Users, UserCircle } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center text-primary font-mono animate-pulse">LOADING...</div>;
  }
  
  if (!session) {
    return <Auth />; // Redirect handled inside Auth component
  }

  return <Component {...rest} />;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  // Don't show shell on auth or camera pages
  if (location === "/auth" || location.startsWith("/camera")) {
    return <>{children}</>;
  }

  const navItems = [
    { path: "/hunt", icon: Target, label: "HUNT" },
    { path: "/rankings", icon: Trophy, label: "RANKS" },
    { path: "/friends", icon: Users, label: "CREW" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[430px] mx-auto relative border-x border-border/30 shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b-2 border-border p-4 flex justify-between items-center">
        <Link href="/hunt" className="text-xl font-bold font-mono tracking-tighter text-primary uppercase">
          FLASHHUNT
        </Link>
        <Link href="/profile">
          <Avatar className="h-8 w-8 rounded-none border-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="rounded-none bg-black text-primary font-mono text-xs">
              {user?.username?.substring(0, 2).toUpperCase() || "ME"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] bg-black border-t-2 border-[#333] pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-5 h-5 mb-1" />
                <span className="font-mono text-[10px] font-bold uppercase">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        const { session, isLoading } = useAuth();
        const [, setLocation] = useLocation();
        
        if (!isLoading) {
          setLocation(session ? "/hunt" : "/auth");
        }
        
        return <div className="min-h-[100dvh] bg-background"></div>;
      }} />
      <Route path="/auth" component={Auth} />
      <Route path="/hunt">
        <ProtectedRoute component={Hunt} />
      </Route>
      <Route path="/camera/:itemId">
        <ProtectedRoute component={Camera} />
      </Route>
      <Route path="/rankings">
        <ProtectedRoute component={Rankings} />
      </Route>
      <Route path="/friends">
        <ProtectedRoute component={Friends} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
