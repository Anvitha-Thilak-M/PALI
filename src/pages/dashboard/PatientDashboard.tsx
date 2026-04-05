import { useState, useEffect } from 'react';
import { CalendarPlus, Clock, CalendarCheck, Stethoscope, HeartHandshake, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import AccountTab from '@/components/AccountTab';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type BookingType = 'doctor' | 'caregiver';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [caregiverSchedules, setCaregiverSchedules] = useState<any[]>([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookingType, setBookingType] = useState<BookingType>('doctor');
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const { data: appts } = await supabase.from('appointments').select('*').eq('patient_id', user.id);
    setAppointments(appts || []);

    const { data: doctorRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'doctor');
    if (doctorRoles && doctorRoles.length > 0) {
      const ids = doctorRoles.map(r => r.user_id);
      const [{ data: profiles }, { data: schedules }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', ids),
        supabase.from('doctor_availability').select('*').in('doctor_id', ids).gte('date', format(new Date(), 'yyyy-MM-dd')).order('date'),
      ]);
      setDoctors(profiles || []);
      setDoctorSchedules(schedules || []);
    }

    const { data: caregiverRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'caregiver');
    if (caregiverRoles && caregiverRoles.length > 0) {
      const ids = caregiverRoles.map(r => r.user_id);
      const [{ data: profiles }, { data: schedules }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', ids),
        supabase.from('caregiver_availability').select('*').in('caregiver_id', ids).gte('date', format(new Date(), 'yyyy-MM-dd')).order('date'),
      ]);
      setCaregivers(profiles || []);
      setCaregiverSchedules(schedules || []);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const fetchSlots = async (providerId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let data: any = null;
    if (bookingType === 'doctor') {
      const res = await supabase.from('doctor_availability').select('*').eq('doctor_id', providerId).eq('date', dateStr).maybeSingle();
      data = res.data;
    } else {
      const res = await supabase.from('caregiver_availability').select('*').eq('caregiver_id', providerId).eq('date', dateStr).maybeSingle();
      data = res.data;
    }
    if (!data) { setAvailableSlots([]); return; }
    const booked = data.booked_slots || [];
    setAvailableSlots((data.available_slots || []).filter((s: string) => !booked.includes(s)));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (date && selectedProvider) { fetchSlots(selectedProvider, date); setStep(3); }
  };

  const handleBook = async () => {
    if (!user || !selectedProvider || !selectedDate || !selectedSlot) return;
    setBooking(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Double-booking prevention: re-fetch availability at submit time
    let currentAvailability: any = null;
    if (bookingType === 'doctor') {
      const res = await supabase.from('doctor_availability').select('*').eq('doctor_id', selectedProvider).eq('date', dateStr).maybeSingle();
      currentAvailability = res.data;
    } else {
      const res = await supabase.from('caregiver_availability').select('*').eq('caregiver_id', selectedProvider).eq('date', dateStr).maybeSingle();
      currentAvailability = res.data;
    }

    if (!currentAvailability) {
      toast.error('No availability found for this date.');
      setBooking(false);
      return;
    }

    const bookedNow = currentAvailability.booked_slots || [];
    if (bookedNow.includes(selectedSlot)) {
      toast.error('This slot has already been booked. Please select a different time.');
      // Refresh available slots to reflect current state
      const booked = currentAvailability.booked_slots || [];
      setAvailableSlots((currentAvailability.available_slots || []).filter((s: string) => !booked.includes(s)));
      setSelectedSlot('');
      setBooking(false);
      return;
    }

    const insertData: any = { patient_id: user.id, date: dateStr, time_slot: selectedSlot };
    if (bookingType === 'doctor') {
      insertData.doctor_id = selectedProvider;
    } else {
      insertData.caregiver_id = selectedProvider;
      if (doctors.length > 0) { insertData.doctor_id = doctors[0].id; }
      else { toast.error('No doctors available'); setBooking(false); return; }
    }

    const { error } = await supabase.from('appointments').insert(insertData);
    if (error) {
      toast.error('Failed to book appointment. Please try again.');
      setBooking(false);
      return;
    }

    // Mark slot as booked in availability table
    await supabase.rpc('book_slot', {
      _table_name: bookingType === 'doctor' ? 'doctor_availability' : 'caregiver_availability',
      _provider_id: selectedProvider, _date: dateStr, _slot: selectedSlot,
    });

    toast.success(`${bookingType === 'doctor' ? 'Doctor' : 'Caregiver'} appointment booked successfully!`);

    // Send SMS notifications (non-blocking)
    const session = await supabase.auth.getSession();
    supabase.functions.invoke('send-sms', {
      body: {
        event: 'appointment_booked',
        patientId: user.id,
        doctorId: bookingType === 'doctor' ? selectedProvider : null,
        caregiverId: bookingType === 'caregiver' ? selectedProvider : null,
        date: dateStr,
        timeSlot: selectedSlot,
        bookingType,
      },
      headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
    }).catch(() => {});

    setBookOpen(false);
    resetBooking();
    loadData();
    setBooking(false);
  };

  const resetBooking = () => {
    setStep(1); setSelectedProvider(''); setSelectedDate(undefined); setSelectedSlot(''); setAvailableSlots([]);
  };

  const openBooking = (type: BookingType) => { setBookingType(type); resetBooking(); setBookOpen(true); };

  const providers = bookingType === 'doctor' ? doctors : caregivers;
  const providerLabel = bookingType === 'doctor' ? 'Doctor' : 'Caregiver';
  const schedules = bookingType === 'doctor' ? doctorSchedules : caregiverSchedules;
  const providerIdKey = bookingType === 'doctor' ? 'doctor_id' : 'caregiver_id';

  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;

  return (
    <DashboardLayout title="Patient Dashboard">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Total Appointments" value={appointments.length} icon={CalendarCheck} delay={0} color="bg-primary/10 text-primary" />
          <StatsCard title="Pending" value={pendingCount} icon={Clock} delay={0.1} color="bg-warning/10 text-warning" />
          <StatsCard title="Confirmed" value={confirmedCount} icon={CalendarPlus} delay={0.2} color="bg-success/10 text-success" />
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="account" className="gap-1">
              <User className="h-3.5 w-3.5" /> My Account
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xl font-semibold mb-4 text-foreground">My Appointments</h2>
              <div className="glass-card rounded-xl p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No appointments yet</TableCell></TableRow>
                    ) : appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.date}</TableCell>
                        <TableCell>{a.time_slot}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.caregiver_id ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                          }`}>
                            {a.caregiver_id ? <HeartHandshake className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />}
                            {a.caregiver_id ? 'Caregiver' : 'Doctor'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === 'Confirmed' ? 'bg-success/10 text-success' :
                            a.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                            'bg-warning/10 text-warning'
                          }`}>{a.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Book Appointment Tab */}
          <TabsContent value="book">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Book an Appointment</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  onClick={() => openBooking('doctor')}
                  className="glass-card group flex items-center gap-4 rounded-xl p-6 text-left transition-all hover:shadow-xl hover:border-primary/50"
                >
                  <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Book Doctor</h3>
                    <p className="text-sm text-muted-foreground">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available</p>
                  </div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  onClick={() => openBooking('caregiver')}
                  className="glass-card group flex items-center gap-4 rounded-xl p-6 text-left transition-all hover:shadow-xl hover:border-accent/50"
                >
                  <div className="rounded-lg bg-accent/10 p-3 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Book Caregiver</h3>
                    <p className="text-sm text-muted-foreground">{caregivers.length} caregiver{caregivers.length !== 1 ? 's' : ''} available</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <AccountTab role="patient" />
          </TabsContent>
        </Tabs>

        {/* Booking Dialog */}
        <Dialog open={bookOpen} onOpenChange={(open) => { setBookOpen(open); if (!open) resetBooking(); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book {providerLabel} — Step {step}/3</DialogTitle>
              <DialogDescription>Select a {providerLabel.toLowerCase()}, date, and time slot.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {step >= 1 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Step 1: Select {providerLabel}</p>
                  <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); setStep(2); }}>
                    <SelectTrigger><SelectValue placeholder={`Choose a ${providerLabel.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>
                      {providers.length === 0 ? (
                        <SelectItem value="none" disabled>No {providerLabel.toLowerCase()}s found</SelectItem>
                      ) : providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.specialization ? `(${p.specialization})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step >= 2 && selectedProvider && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-semibold mb-2 text-foreground">
                    {providers.find(p => p.id === selectedProvider)?.name}'s Schedule
                  </p>
                  {(() => {
                    const providerSchedule = schedules.filter(s => s[providerIdKey] === selectedProvider);
                    if (providerSchedule.length === 0) return <p className="text-sm text-muted-foreground">No availability set yet.</p>;
                    return (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {providerSchedule.map((s: any) => {
                          const booked = s.booked_slots || [];
                          const freeSlots = (s.available_slots || []).filter((sl: string) => !booked.includes(sl));
                          return (
                            <div key={s.id} className="flex items-start gap-2 text-sm">
                              <span className="font-medium text-foreground whitespace-nowrap">{s.date}:</span>
                              <div className="flex flex-wrap gap-1">
                                {freeSlots.length === 0 ? (
                                  <span className="text-muted-foreground text-xs">Fully booked</span>
                                ) : freeSlots.map((sl: string) => (
                                  <Badge key={sl} variant="secondary" className="text-xs">{sl}</Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {step >= 2 && selectedProvider && (
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Step 2: Select Date</p>
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={(date) => date < new Date()} className="rounded-md border pointer-events-auto" />
                </div>
              )}

              {step >= 3 && selectedDate && (
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Step 3: Select Time Slot</p>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slots available for this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button key={slot} onClick={() => setSelectedSlot(slot)}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            selectedSlot === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted'
                          }`}>{slot}</button>
                      ))}
                    </div>
                  )}
                  {selectedSlot && (
                    <Button onClick={handleBook} className="mt-4 w-full" disabled={booking}>
                      {booking ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
