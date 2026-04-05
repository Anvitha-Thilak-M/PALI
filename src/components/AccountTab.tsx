import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Shield, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AccountTabProps {
  role: 'patient' | 'doctor' | 'caregiver';
}

export default function AccountTab({ role }: AccountTabProps) {
  const { profile, signOut } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordForm.new || !passwordForm.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password changed successfully');
      setPasswordForm({ new: '', confirm: '' });
      setPasswordOpen(false);
    }
    setChangingPassword(false);
  };

  const p = profile as any;

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Personal Details
          </CardTitle>
          <CardDescription>Your personal information (contact admin to update)</CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow label="Full Name" value={p?.name} />
          <InfoRow label="Username" value={p?.username} />
          <InfoRow label="Email" value={p?.email} />
          <InfoRow label="Phone" value={p?.phone} />
          <InfoRow label="Gender" value={p?.gender} />
          <InfoRow label="Date of Birth" value={p?.date_of_birth} />
          <InfoRow label="Blood Group" value={p?.blood_group} />
          <InfoRow label="Place / Address" value={p?.address} />
          {role === 'patient' && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Medical Info</p>
              <InfoRow label="Age" value={p?.age} />
              <InfoRow label="Disease / Condition" value={p?.disease} />
              <InfoRow label="Diagnosed Year" value={p?.diagnosed_year} />
              <InfoRow label="Years of Treatment" value={p?.years_of_treatment} />
              <InfoRow label="Treatment Status" value={p?.treatment_status} />
              <InfoRow label="Emergency Contact" value={p?.emergency_contact} />
            </>
          )}
          {role === 'doctor' && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Professional Info</p>
              <InfoRow label="Department" value={p?.department} />
              <InfoRow label="Specialization" value={p?.specialization} />
            </>
          )}
          {role === 'caregiver' && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Professional Info</p>
              <InfoRow label="Specialization" value={p?.specialization} />
            </>
          )}
        </CardContent>
      </Card>

      {role === 'patient' && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" /> Bystander / Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Bystander Name" value={p?.bystander_name} />
            <InfoRow label="Bystander Phone" value={p?.bystander_phone} />
            <InfoRow label="Relation" value={p?.bystander_relation} />
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <Collapsible open={passwordOpen} onOpenChange={setPasswordOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-warning" /> Change Password
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${passwordOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Confirm new password" />
              </div>
              <Button onClick={handlePasswordChange} disabled={changingPassword} className="w-full">
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Button variant="destructive" onClick={signOut} className="w-full gap-2">
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </motion.div>
  );
}
