import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, User, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const demoAccounts = [
  { label: 'Admin', username: 'admin01', password: 'Admin@123' },
  { label: 'Doctor', username: 'doctor01', password: 'Doctor@123' },
  { label: 'Patient', username: 'patient01', password: 'Patient@123' },
  { label: 'Caregiver', username: 'caregiver01', password: 'Care@123' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  if (user && role) {
    navigate(`/dashboard/${role}`, { replace: true });
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('login-with-username', {
        body: { username: username.trim(), password },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success('Welcome back!');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    }
    setIsLoading(false);
  };

  const fillDemo = (demo: typeof demoAccounts[0]) => {
    setUsername(demo.username);
    setPassword(demo.password);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden gradient-hero lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-md text-center">
          <Heart className="mx-auto mb-6 h-16 w-16 text-primary-foreground" fill="currentColor" />
          <h1 className="mb-4 font-display text-4xl font-bold text-primary-foreground">PalliCare</h1>
          <p className="text-lg text-primary-foreground/70">
            Comprehensive palliative care management for patients, doctors, and caregivers.
          </p>
        </motion.div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex items-center gap-2 lg:hidden">
                <Heart className="h-6 w-6 text-primary" fill="currentColor" />
                <span className="text-lg font-bold">PalliCare</span>
              </div>
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <LogIn className="h-4 w-4" />}
                  Sign In
                </Button>
              </form>

              <div className="mt-6">
                <p className="mb-3 text-center text-xs font-medium text-muted-foreground">DEMO ACCOUNTS</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((demo) => (
                    <button key={demo.label} type="button" onClick={() => fillDemo(demo)} className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                      <span className="block font-semibold">{demo.label}</span>
                      <span className="text-muted-foreground">{demo.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
