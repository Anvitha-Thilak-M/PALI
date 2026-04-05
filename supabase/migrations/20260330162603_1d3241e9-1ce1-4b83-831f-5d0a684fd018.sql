
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient', 'caregiver');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  specialization TEXT,
  emergency_contact TEXT,
  avatar_url TEXT,
  age INTEGER,
  disease TEXT,
  years_of_treatment INTEGER,
  assigned_doctor_id UUID,
  assigned_caregiver_id UUID,
  department TEXT,
  gender TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  diagnosed_year INTEGER,
  treatment_status TEXT,
  bystander_name TEXT,
  bystander_phone TEXT,
  bystander_relation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create doctor_availability table
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_slots TEXT[] NOT NULL DEFAULT '{}',
  booked_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create caregiver_availability table
CREATE TABLE public.caregiver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_slots TEXT[] NOT NULL DEFAULT '{}',
  booked_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis TEXT,
  treatment TEXT,
  medicines TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- book_slot function
CREATE OR REPLACE FUNCTION public.book_slot(
  _table_name text,
  _provider_id uuid,
  _date date,
  _slot text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _table_name = 'doctor_availability' THEN
    UPDATE public.doctor_availability
    SET booked_slots = array_append(booked_slots, _slot)
    WHERE doctor_id = _provider_id AND date = _date;
  ELSIF _table_name = 'caregiver_availability' THEN
    UPDATE public.caregiver_availability
    SET booked_slots = array_append(booked_slots, _slot)
    WHERE caregiver_id = _provider_id AND date = _date;
  END IF;
END;
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR id = auth.uid());
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Caregivers can view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'caregiver'));
CREATE POLICY "Patients can view doctor and caregiver profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'patient'::app_role) AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = profiles.id AND role IN ('doctor', 'caregiver')));

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can view doctor and caregiver roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'patient'::app_role) AND role IN ('doctor', 'caregiver'));

-- Doctor availability policies
CREATE POLICY "Anyone authenticated can view doctor availability" ON public.doctor_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can manage own availability" ON public.doctor_availability FOR INSERT WITH CHECK (doctor_id = auth.uid() AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update own availability" ON public.doctor_availability FOR UPDATE USING (doctor_id = auth.uid() AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can delete own availability" ON public.doctor_availability FOR DELETE USING (doctor_id = auth.uid() AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admin can manage all doctor availability" ON public.doctor_availability FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Caregiver availability policies
CREATE POLICY "Anyone authenticated can view caregiver availability" ON public.caregiver_availability FOR SELECT USING (true);
CREATE POLICY "Caregivers can manage own availability" ON public.caregiver_availability FOR INSERT WITH CHECK (caregiver_id = auth.uid() AND has_role(auth.uid(), 'caregiver'::app_role));
CREATE POLICY "Caregivers can update own availability" ON public.caregiver_availability FOR UPDATE USING (caregiver_id = auth.uid() AND has_role(auth.uid(), 'caregiver'::app_role));
CREATE POLICY "Caregivers can delete own availability" ON public.caregiver_availability FOR DELETE USING (caregiver_id = auth.uid() AND has_role(auth.uid(), 'caregiver'::app_role));
CREATE POLICY "Admin can manage all caregiver availability" ON public.caregiver_availability FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Appointments policies
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can view their appointments" ON public.appointments FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "Caregivers can view their appointments" ON public.appointments FOR SELECT USING (caregiver_id = auth.uid());
CREATE POLICY "Admin can view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid() AND public.has_role(auth.uid(), 'patient'));
CREATE POLICY "Doctors can update appointment status" ON public.appointments FOR UPDATE USING (doctor_id = auth.uid() AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Caregivers can update appointment status" ON public.appointments FOR UPDATE USING (caregiver_id = auth.uid() AND has_role(auth.uid(), 'caregiver'::app_role));
CREATE POLICY "Admin can manage all appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Medical records policies
CREATE POLICY "Patients can view own records" ON public.medical_records FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can manage records" ON public.medical_records FOR ALL USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admin can manage all records" ON public.medical_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctor_availability_updated_at BEFORE UPDATE ON public.doctor_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_caregiver_availability_updated_at BEFORE UPDATE ON public.caregiver_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
