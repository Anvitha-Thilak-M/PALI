import { useState, useEffect } from 'react';
import { Users, Stethoscope, HeartHandshake, CalendarCheck, Plus, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const TREATMENT_STATUSES = ['Ongoing', 'Completed', 'Paused', 'Scheduled'];

const emptyForm = {
  name: '', password: '', username: '', phone: '', specialization: '',
  emergencyContact: '', age: '', disease: '', yearsOfTreatment: '', department: '',
  gender: '', dateOfBirth: '', bloodGroup: '', diagnosedYear: '', treatmentStatus: '',
  bystanderName: '', bystanderPhone: '', bystanderRelation: '',
  assignedDoctorId: '', assignedCaregiverId: '', address: '',
};

type FieldErrors = Partial<Record<keyof typeof emptyForm | 'duplicate', string>>;

const errClass = (err?: string) => err ? 'border-red-500 focus-visible:ring-red-500' : '';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole>('patient');
  const [addRole, setAddRole] = useState<AppRole>('patient');
  const [form, setForm] = useState({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fetchUsers = async (role: AppRole) => {
    const session = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('manage-user', {
      body: { action: 'list', role },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    });
    return res.data?.users || [];
  };

  const loadAll = async () => {
    setLoading(true);
    const [p, d, c] = await Promise.all([fetchUsers('patient'), fetchUsers('doctor'), fetchUsers('caregiver')]);
    setPatients(p); setDoctors(d); setCaregivers(c);
    const { data: appts } = await supabase.from('appointments').select('*');
    setAppointments(appts || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const setField = (key: keyof typeof emptyForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: '' }));
    if (fieldErrors.duplicate) setFieldErrors(e => ({ ...e, duplicate: '' }));
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const nameOnly = /^[a-zA-Z\s]+$/;
    const placeOnly = /^[a-zA-Z\s]+$/;

    if (!form.name) {
      errors.name = 'Name is required';
    } else if (!nameOnly.test(form.name)) {
      errors.name = 'Name must contain only letters and spaces';
    }

    if (!form.username) {
      errors.username = 'Username is required';
    }

    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length !== 10) errors.phone = 'Phone number must be exactly 10 digits';
      else if (!/^\d+$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Only numeric values allowed';
    }

    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Invalid date of birth';
      } else if (dob > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be a future date';
      }
    }

    if (form.address && !placeOnly.test(form.address)) {
      errors.address = 'Place should contain only letters and spaces';
    }

    if (form.bystanderPhone) {
      const digits = form.bystanderPhone.replace(/\D/g, '');
      if (digits.length !== 10) errors.bystanderPhone = 'Bystander phone must be exactly 10 digits';
    }

    return errors;
  };

  const checkDuplicate = async (excludeId?: string): Promise<{ isDuplicate: boolean }> => {
    if (!form.name || !form.dateOfBirth || !form.address) return { isDuplicate: false };
    let q = supabase
      .from('profiles')
      .select('id')
      .ilike('name', form.name.trim())
      .eq('date_of_birth', form.dateOfBirth)
      .ilike('address', form.address.trim());
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q;
    return { isDuplicate: !!(data && data.length > 0) };
  };

  const resetForm = () => { setForm({ ...emptyForm }); setFieldErrors({}); };

  const handleAdd = async () => {
    const errors = validateForm();
    if (!form.password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    const { isDuplicate } = await checkDuplicate();
    if (isDuplicate) {
      const msg = 'This account already exists in the system.';
      setFieldErrors({ duplicate: msg, name: ' ', dateOfBirth: ' ', address: ' ' });
      toast.error(msg);
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create', role: addRole, ...form,
          age: form.age ? parseInt(form.age) : null,
          yearsOfTreatment: form.yearsOfTreatment ? parseInt(form.yearsOfTreatment) : null,
          diagnosedYear: form.diagnosedYear ? parseInt(form.diagnosedYear) : null,
        },
        headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
      });

      // Check for errors - handle both FunctionsHttpError and data-level errors
      const errorMsg = data?.error || (error ? (error as any)?.message || 'Failed to create user' : null);
      if (errorMsg) {
        toast.error(errorMsg);
        return;
      }

      toast.success('User created successfully');

      // Send welcome SMS with login credentials (non-blocking)
      if (form.phone) {
        supabase.functions.invoke('send-sms', {
          body: {
            event: 'account_created',
            phone: form.phone,
            name: form.name,
            role: addRole,
            username: form.username,
            password: form.password,
          },
          headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
        }).catch(() => {});
      }

      setAddOpen(false);
      resetForm();
      loadAll();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create user');
    }
  };

  const openEditDialog = (userProfile: any, role: AppRole) => {
    setEditUserId(userProfile.id);
    setEditRole(role);
    setFieldErrors({});
    setForm({
      name: userProfile.name || '',
      password: '',
      username: userProfile.username || '',
      phone: userProfile.phone || '',
      specialization: userProfile.specialization || '',
      emergencyContact: userProfile.emergency_contact || '',
      age: userProfile.age?.toString() || '',
      disease: userProfile.disease || '',
      yearsOfTreatment: userProfile.years_of_treatment?.toString() || '',
      department: userProfile.department || '',
      gender: userProfile.gender || '',
      dateOfBirth: userProfile.date_of_birth || '',
      bloodGroup: userProfile.blood_group || '',
      diagnosedYear: userProfile.diagnosed_year?.toString() || '',
      treatmentStatus: userProfile.treatment_status || '',
      bystanderName: userProfile.bystander_name || '',
      bystanderPhone: userProfile.bystander_phone || '',
      bystanderRelation: userProfile.bystander_relation || '',
      assignedDoctorId: userProfile.assigned_doctor_id || '',
      assignedCaregiverId: userProfile.assigned_caregiver_id || '',
      address: userProfile.address || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    const errors = validateForm();
    delete errors.username;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    const { isDuplicate } = await checkDuplicate(editUserId ?? undefined);
    if (isDuplicate) {
      const msg = 'This account already exists in the system.';
      setFieldErrors({ duplicate: msg, name: ' ', dateOfBirth: ' ', address: ' ' });
      toast.error(msg);
      return;
    }

    const session = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: {
        action: 'update', userId: editUserId, role: editRole, ...form,
        age: form.age ? parseInt(form.age) : null,
        yearsOfTreatment: form.yearsOfTreatment ? parseInt(form.yearsOfTreatment) : null,
        diagnosedYear: form.diagnosedYear ? parseInt(form.diagnosedYear) : null,
      },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    });
    if (error || data?.error) {
      toast.error(data?.error || 'Failed to update user');
    } else {
      toast.success('User updated');
      setEditOpen(false);
      resetForm();
      loadAll();
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    const session = await supabase.auth.getSession();
    await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', userId },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    });
    toast.success('User deleted');
    loadAll();
  };

  const handleSeedDemo = async () => {
    const session = await supabase.auth.getSession();
    await supabase.functions.invoke('manage-user', {
      body: { action: 'seed-demo' },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    });
    toast.success('Demo users seeded!');
    loadAll();
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg && msg.trim() ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  const UserFormFields = ({ role, isEdit = false }: { role: AppRole; isEdit?: boolean }) => (
    <div className="space-y-4">
      {fieldErrors.duplicate && (
        <div className="rounded-md border border-red-400 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
          {fieldErrors.duplicate}
        </div>
      )}

      {!isEdit && (
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => { setAddRole(v as AppRole); setFieldErrors({}); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="caregiver">Caregiver</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Name *</Label>
        <Input
          className={errClass(fieldErrors.name)}
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Full name (letters only)"
        />
        <FieldError msg={fieldErrors.name} />
      </div>

      {!isEdit && (
        <div>
          <Label>Username *</Label>
          <Input
            className={errClass(fieldErrors.username)}
            value={form.username}
            onChange={(e) => setField('username', e.target.value)}
            placeholder="Enter username"
          />
          <FieldError msg={fieldErrors.username} />
        </div>
      )}

      {!isEdit && (
        <div>
          <Label>Password *</Label>
          <Input
            type="password"
            className={errClass(fieldErrors.password)}
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
          />
          <FieldError msg={fieldErrors.password} />
        </div>
      )}

      <Separator />
      <p className="text-sm font-semibold text-foreground">Personal Details</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setField('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input
            type="date"
            className={errClass(fieldErrors.dateOfBirth)}
            value={form.dateOfBirth}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
          />
          <FieldError msg={fieldErrors.dateOfBirth} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Blood Group</Label>
          <Select value={form.bloodGroup} onValueChange={(v) => setField('bloodGroup', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Phone (10 digits)</Label>
          <Input
            className={errClass(fieldErrors.phone)}
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="9876543210"
            maxLength={10}
          />
          <FieldError msg={fieldErrors.phone} />
        </div>
      </div>

      <div>
        <Label>Place / Address</Label>
        <Input
          className={errClass(fieldErrors.address)}
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="City or location (letters only)"
        />
        <FieldError msg={fieldErrors.address} />
      </div>

      {/* Patient-specific */}
      {role === 'patient' && (
        <>
          <Separator />
          <p className="text-sm font-semibold text-foreground">Medical Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setField('age', e.target.value)} /></div>
            <div><Label>Disease / Condition</Label><Input value={form.disease} onChange={(e) => setField('disease', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Diagnosed Year</Label><Input type="number" value={form.diagnosedYear} onChange={(e) => setField('diagnosedYear', e.target.value)} placeholder="e.g. 2022" /></div>
            <div><Label>Years of Treatment</Label><Input type="number" value={form.yearsOfTreatment} onChange={(e) => setField('yearsOfTreatment', e.target.value)} /></div>
          </div>
          <div>
            <Label>Treatment Status</Label>
            <Select value={form.treatmentStatus} onValueChange={(v) => setField('treatmentStatus', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{TREATMENT_STATUSES.map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={(e) => setField('emergencyContact', e.target.value)} /></div>

          <Separator />
          <p className="text-sm font-semibold text-foreground">Assigned Providers</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assigned Doctor</Label>
              <Select value={form.assignedDoctorId} onValueChange={(v) => setField('assignedDoctorId', v)}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned Caregiver</Label>
              <Select value={form.assignedCaregiverId} onValueChange={(v) => setField('assignedCaregiverId', v)}>
                <SelectTrigger><SelectValue placeholder="Select caregiver" /></SelectTrigger>
                <SelectContent>
                  {caregivers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <p className="text-sm font-semibold text-foreground">Bystander / Emergency Contact</p>
          <div><Label>Bystander Name</Label><Input value={form.bystanderName} onChange={(e) => setField('bystanderName', e.target.value)} /></div>
          <div>
            <Label>Bystander Phone (10 digits)</Label>
            <Input
              className={errClass(fieldErrors.bystanderPhone)}
              value={form.bystanderPhone}
              maxLength={10}
              onChange={(e) => setField('bystanderPhone', e.target.value)}
            />
            <FieldError msg={fieldErrors.bystanderPhone} />
          </div>
          <div><Label>Relation</Label><Input value={form.bystanderRelation} onChange={(e) => setField('bystanderRelation', e.target.value)} placeholder="e.g. Spouse, Parent" /></div>
        </>
      )}

      {/* Doctor-specific */}
      {role === 'doctor' && (
        <>
          <Separator />
          <p className="text-sm font-semibold text-foreground">Professional Details</p>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setField('department', e.target.value)} /></div>
          <div><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setField('specialization', e.target.value)} /></div>
        </>
      )}

      {/* Caregiver-specific */}
      {role === 'caregiver' && (
        <>
          <Separator />
          <p className="text-sm font-semibold text-foreground">Professional Details</p>
          <div><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setField('specialization', e.target.value)} /></div>
        </>
      )}
    </div>
  );

  const PatientTable = ({ users }: { users: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead>
          <TableHead>Disease</TableHead><TableHead>Treatment Status</TableHead>
          <TableHead>Phone</TableHead><TableHead>Place</TableHead><TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No patients found</TableCell></TableRow>
        ) : users.map((u: any) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell>{u.age || '—'}</TableCell>
            <TableCell>{u.gender || '—'}</TableCell>
            <TableCell>{u.disease || '—'}</TableCell>
            <TableCell>{u.treatment_status || '—'}</TableCell>
            <TableCell>{u.phone || '—'}</TableCell>
            <TableCell>{u.address || '—'}</TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(u, 'patient')}><Pencil className="h-4 w-4 text-primary" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const DoctorTable = ({ users }: { users: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Specialization</TableHead>
          <TableHead>Phone</TableHead><TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No doctors found</TableCell></TableRow>
        ) : users.map((u: any) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell>{u.department || '—'}</TableCell>
            <TableCell>{u.specialization || '—'}</TableCell>
            <TableCell>{u.phone || '—'}</TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(u, 'doctor')}><Pencil className="h-4 w-4 text-primary" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const CaregiverTable = ({ users }: { users: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead><TableHead>Specialization</TableHead><TableHead>Phone</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No caregivers found</TableCell></TableRow>
        ) : users.map((u: any) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell>{u.specialization || '—'}</TableCell>
            <TableCell>{u.phone || '—'}</TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(u, 'caregiver')}><Pencil className="h-4 w-4 text-primary" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Patients" value={patients.length} icon={Users} delay={0} color="bg-accent/10 text-accent" />
          <StatsCard title="Doctors" value={doctors.length} icon={Stethoscope} delay={0.1} color="bg-success/10 text-success" />
          <StatsCard title="Caregivers" value={caregivers.length} icon={HeartHandshake} delay={0.2} color="bg-warning/10 text-warning" />
          <StatsCard title="Appointments" value={appointments.length} icon={CalendarCheck} delay={0.3} color="bg-primary/10 text-primary" />
        </div>

        <div className="flex gap-3">
          {/* Add User Dialog */}
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
              {UserFormFields({ role: addRole })}
              <Button onClick={handleAdd} className="w-full mt-2">Create User</Button>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Edit {editRole.charAt(0).toUpperCase() + editRole.slice(1)}</DialogTitle></DialogHeader>
              {UserFormFields({ role: editRole, isEdit: true })}
              <Button onClick={handleUpdate} className="w-full mt-2">Update User</Button>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleSeedDemo}>Seed Demo Users</Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Tabs defaultValue="patients">
            <TabsList>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="doctors">Doctors</TabsTrigger>
              <TabsTrigger value="caregivers">Caregivers</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            <TabsContent value="patients" className="mt-4">
              <div className="glass-card rounded-xl p-4">{PatientTable({ users: patients })}</div>
            </TabsContent>
            <TabsContent value="doctors" className="mt-4">
              <div className="glass-card rounded-xl p-4">{DoctorTable({ users: doctors })}</div>
            </TabsContent>
            <TabsContent value="caregivers" className="mt-4">
              <div className="glass-card rounded-xl p-4">{CaregiverTable({ users: caregivers })}</div>
            </TabsContent>
            <TabsContent value="appointments" className="mt-4">
              <div className="glass-card rounded-xl p-4">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time Slot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No appointments</TableCell></TableRow>
                    ) : appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.time_slot}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'Confirmed' ? 'bg-success/10 text-success' : a.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{a.status}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={async () => { await supabase.from('appointments').delete().eq('id', a.id); toast.success('Deleted'); loadAll(); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
