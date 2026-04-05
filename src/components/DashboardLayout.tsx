import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  nav?: { label: string; href: string; icon: ReactNode; active?: boolean }[];
}

export default function DashboardLayout({ children, title, nav }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
              <span className="font-bold text-foreground">PalliCare</span>
            </Link>
            <span className="text-sm text-muted-foreground">/ {title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="hidden text-foreground sm:inline">{profile?.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {role}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {nav && nav.length > 0 && (
        <div className="border-b border-border bg-muted/30">
          <div className="container flex gap-1 overflow-x-auto py-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="container flex-1 py-6">{children}</main>
    </div>
  );
}
