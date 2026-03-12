// Database entity types for dental clinic ERP

export interface City {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'doctor' | 'receptionist';
  doctor_id?: string;
  active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  national_id: string;
  birth_date?: string;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  national_id?: string;
  phone?: string;
  address?: string;
  city_id?: string;
  birth_date?: string;
  medical_history?: string;
  created_at: string;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  active: boolean;
  created_at: string;
}

export interface Procedure {
  id: string;
  patient_id: string;
  treatment_id: string;
  diagnosis?: string;
  tooth_code?: string;
  total_cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  general_notes?: string;
  created_at: string;
}

export interface Session {
  id: string;
  procedure_id: string;
  appointment_id: string;
  session_number: number;
  description: string;
  progress_notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  procedure_id: string;
  payment_method_id: string; // CAMBIADO: antes era payment_method
  amount: number;
  transaction_reference?: string;
  payment_date: string;
  notes?: string;
  created_at?: string;
  
  // Campos adicionales para UI (no en DB)
  payment_method_name?: string; // Nuevo: para mostrar el nombre
}

export interface PatientProfile extends Patient {
  city_name?: string;
  appointments: AppointmentDetail[];
  procedures: ProcedureDetail[];
  totalPaid: number;
  totalPending: number;
}

export interface ProcedureDetail extends Procedure {
  treatment?: Treatment;
  sessions?: Session[];
  payments?: Payment[];
  totalPaid?: number;
  totalPending?: number;
}

export interface AppointmentDetail extends Appointment {
  patient?: Patient;
  doctor?: Doctor;
  sessions?: Session[];
}

export interface DoctorProfile extends Doctor {
  user?: User;
  appointments?: Appointment[];
  procedures?: Procedure[];
}
