import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    setLocation("/hunt");
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // The onAuthStateChange in AuthContext will handle the redirect
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-2 border-primary bg-card/80 backdrop-blur-sm shadow-[8px_8px_0px_0px_hsl(var(--primary))] rounded-none">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-mono tracking-tighter uppercase text-primary">FLASHHUNT</CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase text-xs">
              Street Scavenger Hunt // Drop In
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" onClick={handleGoogleAuth} className="w-full border-2 border-foreground hover:bg-primary hover:text-primary-foreground uppercase font-bold tracking-wider rounded-none">
              Continue with Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-mono">Or</span>
              </div>
            </div>
            <form onSubmit={handleAuth} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="uppercase font-mono text-xs">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="uppercase font-mono text-xs">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary font-mono bg-background"
                  required 
                />
              </div>
              {error && <div className="text-destructive text-xs font-mono font-bold uppercase">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground uppercase font-bold tracking-wider rounded-none mt-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] transition-all">
                {loading ? "PROCESSING..." : (isSignUp ? "JOIN THE HUNT" : "ENTER")}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              variant="link" 
              className="w-full text-muted-foreground hover:text-primary font-mono uppercase text-xs rounded-none"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already initiated? Log in" : "New blood? Sign up"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
