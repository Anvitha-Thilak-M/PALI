import { useState, useEffect } from 'react';
import { CalendarDays, Clock, Check, X, Plus, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import AccountTab from '@/components/AccountTab';
import ClockPicker from '@/components/ClockPicker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const [{ data: appts }, { data: avail }] = await Promise.all([
      supabase.from('appointments').select('*').eq('doctor_id', user.id),
      supabase.from('doctor_availability').select('*').eq('doctor_id', user.id),
    ]);
    setAppointments(appts || []);
    setAvailability(avail || []);
    const { data: patients } = await supabase.from('profiles').select('*').eq('assigned_doctor_id', user.id) as { data: any[] | null };
    setAssignedPatients(patients || []);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleToggleSlot = (slot: string) => {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSetAvailability = async () => {
    if (!user || !selectedDate || selectedSlots.length === 0) {
      toast.error('Pick a date and select at least one time slot on the clock');
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingEntries = availability.filter(a => a.date === dateStr);
    if (existingEntries.length > 0) {
      // Merge new slots with all existing slots for this date
      const allExistingSlots = existingEntries.flatMap(a => a.available_slots || []);
      const mergedSlots = [...new Set([...allExistingSlots, ...selectedSlots])];
      // Update the first entry with merged slots
      await supabase.from('doctor_availability').update({ available_slots: mergedSlots }).eq('id', existingEntries[0].id);
    } else {
      await supabase.from('doctor_availability').insert({ doctor_id: user.id, date: dateStr, available_slots: selectedSlots });
    }
    toast.success('Availability saved');
    setScheduleOpen(false);
    setSelectedSlots([]);
    loadData();
  };

  const handleAppointmentAction = async (id: string, status: 'Confirmed' | 'Rejected') => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    toast.success(`Appointment ${status.toLowerCase()}`);
    const session = await supabase.auth.getSession();
    supabase.functions.invoke('send-sms', {
      body: { event: 'appointment_status_changed', appointmentId: id, status },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    }).catch(() => {});
    loadData();
  };

  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-4">
          <StatsCard title="Pending Requests" value={pendingCount} icon={Clock} delay={0} color="bg-warning/10 text-warning" />
          <StatsCard title="Confirmed" value={confirmedCount} icon={Check} delay={0.1} color="bg-success/10 text-success" />
          <StatsCard title="Available Days" value={availability.length} icon={CalendarDays} delay={0.2} color="bg-primary/10 text-primary" />
          <StatsCard title="Assigned Patients" value={assignedPatients.length} icon={Users} delay={0.3} color="bg-accent/10 text-accent" />
        </div>

        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="availability">My Availability</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-1">
              <Users className="h-3.5 w-3.5" /> My Patients
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1">
              <User className="h-3.5 w-3.5" /> My Account
            </TabsTrigger>
          </TabsList>

          {/* Availability Tab */}
          <TabsContent value="availability">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Schedule Management</h2>
                <Dialog open={scheduleOpen} onOpenChange={(open) => {
                  setScheduleOpen(open);
                  if (!open) setSelectedSlots([]);
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="h-4 w-4" /> Set Availability</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Set Available Slots</DialogTitle>
                      <DialogDescription>Pick a date, then tap time slots on the clock to mark your availability.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pb-2">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => { setSelectedDate(d); setSelectedSlots([]); }}
                        className="rounded-md border pointer-events-auto mx-auto"
                        disabled={(date) => date < new Date()}
                      />
                      <div className="border-t border-border pt-3">
                        <p className="text-sm font-medium text-center text-muted-foreground mb-2">
                          Click a slot on the clock to toggle it
                        </p>
                        <ClockPicker
                          selectedSlots={selectedSlots}
                          onToggleSlot={handleToggleSlot}
                        />
                      </div>
                      <Button
                        onClick={handleSetAvailability}
                        className="w-full"
                        disabled={selectedSlots.length === 0}
                      >
                        Save {selectedSlots.length > 0 ? `${selectedSlots.length} Slot${selectedSlots.length !== 1 ? 's' : ''}` : 'Availability'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="glass-card rounded-xl p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Available Slots</TableHead>
                      <TableHead>Booked Slots</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availability.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No availability set</TableCell></TableRow>
                    ) : availability.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(a.available_slots || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(a.booked_slots || []).length === 0
                              ? <span className="text-xs text-muted-foreground">None</span>
                              : (a.booked_slots || []).map((s: string) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appointment Requests Tab */}
          <TabsContent value="requests">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Appointment Requests</h2>
              <div className="glass-card rounded-xl p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No appointments</TableCell></TableRow>
                    ) : appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.time_slot}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'Confirmed' ? 'bg-success/10 text-success' : a.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                            {a.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {a.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => handleAppointmentAction(a.id, 'Confirmed')} className="gap-1"><Check className="h-3 w-3" /> Confirm</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAppointmentAction(a.id, 'Rejected')} className="gap-1"><X className="h-3 w-3" /> Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* My Patients Tab */}
          <TabsContent value="patients">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Assigned Patients</h2>
              <div className="glass-card rounded-xl p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Disease</TableHead><TableHead>Years of Treatment</TableHead><TableHead>Phone</TableHead><TableHead>Place</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedPatients.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No assigned patients</TableCell></TableRow>
                    ) : assignedPatients.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.age || '—'}</TableCell>
                        <TableCell>{p.disease || '—'}</TableCell>
                        <TableCell>{p.years_of_treatment || '—'}</TableCell>
                        <TableCell>{p.phone || '—'}</TableCell>
                        <TableCell>{p.address || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <AccountTab role="doctor" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
