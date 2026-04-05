import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, Clock, ArrowRight, Stethoscope, HeartHandshake, CalendarCheck, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Heart, title: 'Compassionate Care', description: 'Personalized palliative care plans tailored to each patient\'s needs and comfort.' },
  { icon: Shield, title: 'Secure & Private', description: 'Role-based access control with encrypted data ensuring complete privacy.' },
  { icon: Users, title: 'Team Coordination', description: 'Seamless collaboration between doctors, caregivers, and patients.' },
  { icon: Clock, title: 'Smart Scheduling', description: 'Intelligent appointment booking with real-time availability management.' },
];

const services = [
  { icon: Stethoscope, title: 'Doctor Consultations', description: 'Schedule appointments with specialized palliative care doctors. Real-time availability and instant booking.' },
  { icon: HeartHandshake, title: 'Caregiver Support', description: 'Book trained caregivers for home visits, daily assistance, and compassionate companionship.' },
  { icon: CalendarCheck, title: 'Appointment Management', description: 'Track all your appointments in one place. Get status updates and manage your care schedule.' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Patient Family', quote: 'PalliCare made it so much easier to coordinate between our mother\'s doctor and caregiver. The scheduling system is a lifesaver.' },
  { name: 'Dr. Raj P.', role: 'Palliative Physician', quote: 'Managing my schedule and patient appointments has never been smoother. I can focus on what matters — caring for my patients.' },
  { name: 'Linda K.', role: 'Caregiver', quote: 'I love being able to set my availability and see my schedule at a glance. It\'s simple, efficient, and works great.' },
];

const steps = [
  { step: '01', title: 'Create Account', description: 'Sign up and get your personalized dashboard based on your role.' },
  { step: '02', title: 'Choose Provider', description: 'Browse available doctors and caregivers with their specializations.' },
  { step: '03', title: 'Book Appointment', description: 'Select a date, pick a time slot, and confirm your booking instantly.' },
  { step: '04', title: 'Receive Care', description: 'Get confirmation and attend your appointment with peace of mind.' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="text-lg font-bold text-foreground">PalliCare</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#services" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Services</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Testimonials</a>
            <a href="#contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</a>
          </div>
          <Link to="/login">
            <Button variant="default" size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="gradient-hero absolute inset-0 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="container relative z-10 flex min-h-[85vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="mb-4 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground/90">
              Palliative Care Management System
            </span>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
              Caring with{' '}
              <span className="italic">Dignity</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/75">
              A comprehensive platform connecting patients, doctors, and caregivers for seamless palliative care coordination.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/login">
                <Button size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#services">
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
        <div className="relative z-10 h-16">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="hsl(var(--background))" d="M0,64 C480,0 960,0 1440,64 L1440,64 L0,64 Z" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Built for Better Care
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Every feature designed to improve patient comfort and streamline care coordination.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card group rounded-xl p-6 transition-all hover:shadow-xl"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-muted/30 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">Our Services</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">Book doctors for medical consultations or caregivers for daily support — all in one platform.</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-xl p-8 text-center transition-all hover:shadow-xl"
              >
                <div className="mx-auto mb-5 inline-flex rounded-full bg-primary/10 p-4 text-primary">
                  <service.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">Get started in minutes with our simple four-step process.</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">{s.step}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-8 translate-x-full bg-border lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/30 py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">What People Say</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">Hear from patients, doctors, and caregivers who use PalliCare every day.</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-xl p-8"
              >
                <p className="mb-6 text-sm italic text-muted-foreground leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-primary rounded-2xl p-12 text-center md:p-16"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Experience Better Care?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-primary-foreground/80">
              Join PalliCare today and connect with dedicated healthcare professionals who prioritize your comfort and well-being.
            </p>
            <Link to="/login">
              <Button size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Get Started Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="border-t border-border bg-muted/30 py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" fill="currentColor" />
                <span className="text-lg font-bold text-foreground">PalliCare</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compassionate palliative care management platform connecting patients with the care they deserve.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h4>
              <div className="space-y-2">
                <a href="#services" className="block text-sm text-muted-foreground hover:text-foreground">Services</a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">How It Works</a>
                <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground">Testimonials</a>
                <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  +1 (555) 123-4567
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  care@pallicare.com
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  123 Healthcare Ave, Suite 200
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            PalliCare © 2026. Compassionate Care, Connected.
          </div>
        </div>
      </footer>
    </div>
  );
}
