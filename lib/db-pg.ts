import { query, queryOne, queryAll } from './pg';
import {
  City,
  Patient,
  Doctor,
  Treatment,
  Procedure,
  Appointment,
  Session,
  Payment,
  PatientProfile,
  ProcedureDetail,
  AppointmentDetail,
  PaymentMethod,
} from './types';

// ============ CITY OPERATIONS ============
export async function getCities(): Promise<City[]> {
  return queryAll<City>(
    'SELECT * FROM cities ORDER BY name ASC'
  );
}

export async function addCity(name: string): Promise<City> {
  return queryOne<City>(
    'INSERT INTO cities (name) VALUES ($1) RETURNING *',
    [name]
  ) as Promise<City>;
}

// ============ PATIENT OPERATIONS ============
export async function getPatients(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ patients: any[]; total: number }> {
  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = `WHERE p.full_name ILIKE $1 OR p.national_id ILIKE $1 OR p.phone ILIKE $1`;
    params.push(`%${search}%`);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM patients p ${whereClause}`,
    search ? [params[0]] : []
  );

  const total = parseInt(countResult?.count || '0');

  const patients = await queryAll<any>(
    `SELECT p.*, c.name as city_name FROM patients p
     LEFT JOIN cities c ON p.city_id = c.id
     ${whereClause} ORDER BY p.created_at ${
      sortOrder === 'asc' ? 'ASC' : 'DESC'
    } LIMIT $${search ? '2' : '1'} OFFSET $${search ? '3' : '2'}`,
    search ? [params[0], limit, offset] : [limit, offset]
  );

  return { patients, total };
}

export async function getPatientById(id: string): Promise<PatientProfile | null> {
  // Obtener paciente con la ciudad incluida
  const patient = await queryOne<Patient>(
    `SELECT p.*, c.name as city_name
     FROM patients p
     LEFT JOIN cities c ON p.city_id = c.id
     WHERE p.id = $1`,
    [id]
  );

  if (!patient) return null;

  // Get appointments with doctor info
  const appointmentRows = await queryAll<any>(
    `SELECT a.*, d.full_name as doctor_name, d.id as doctor_id, d.birth_date, d.active, d.created_at as doctor_created_at
     FROM appointments a
     LEFT JOIN doctors d ON a.doctor_id = d.id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC`,
    [id]
  );

  const appointments: AppointmentDetail[] = appointmentRows.map((row) => ({
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    appointment_date: row.appointment_date,
    status: row.status,
    general_notes: row.general_notes,
    created_at: row.created_at,
    patient,
    doctor: row.doctor_id
      ? {
          id: row.doctor_id,
          full_name: row.doctor_name,
          national_id: '',
          birth_date: row.birth_date,
          active: row.active,
          created_at: row.doctor_created_at,
        }
      : undefined,
    sessions: [],
  }));

  // Obtener TODOS los procedimientos del paciente con sus detalles
  const procedures = await queryAll<any>(
    `SELECT p.*, t.name as treatment_name, t.description as treatment_description
     FROM procedures p
     LEFT JOIN treatments t ON p.treatment_id = t.id
     WHERE p.patient_id = $1
     ORDER BY p.created_at DESC`,
    [id]
  );

  const proceduresWithDetails: ProcedureDetail[] = [];
  let totalPaid = 0;
  let totalProceduresCost = 0;

  // Para cada procedimiento, obtener sus pagos y calcular
  for (const proc of procedures) {
    // Obtener pagos de este procedimiento
    const payments = await queryAll<any>(
      `SELECT p.*, pm.name as payment_method_name
       FROM payments p
       LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
       WHERE p.procedure_id = $1`,
      [proc.id]
    );

    // Calcular total pagado para este procedimiento
    const procedurePaid = payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Asegurar que total_cost es número
    const procedureCost = typeof proc.total_cost === 'string' 
      ? parseFloat(proc.total_cost) 
      : proc.total_cost || 0;

    // Acumular totals
    totalPaid += procedurePaid;
    totalProceduresCost += procedureCost;

    // Obtener sesiones del procedimiento
    const sessions = await queryAll<any>(
      'SELECT * FROM procedure_sessions WHERE procedure_id = $1 ORDER BY session_number ASC',
      [proc.id]
    );

    // Construir objeto del procedimiento con detalles
    proceduresWithDetails.push({
      ...proc,
      treatment: proc.treatment_id ? {
        id: proc.treatment_id,
        name: proc.treatment_name,
        description: proc.treatment_description,
        base_price: 0,
        active: true,
        created_at: new Date().toISOString(),
      } : undefined,
      sessions: sessions || [],
      payments: payments || [],
      totalPaid: procedurePaid,
      totalPending: procedureCost - procedurePaid,
    } as ProcedureDetail);
  }

  // Calcular pendiente total
  const totalPending = totalProceduresCost - totalPaid;

  return {
    ...patient,
    city_name: patient.city_name,
    appointments,
    procedures: proceduresWithDetails,
    totalPaid,
    totalPending,
  } as PatientProfile;
}

export async function createPatient(
  patient: Omit<Patient, 'id' | 'created_at'>
): Promise<Patient> {
  return queryOne<Patient>(
    `INSERT INTO patients (full_name, national_id, phone, address, city_id, birth_date, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      patient.full_name,
      patient.national_id,
      patient.phone,
      patient.address,
      patient.city_id,
      patient.birth_date,
      patient.medical_history,
    ]
  ) as Promise<Patient>;
}

export async function updatePatient(
  id: string,
  patient: Partial<Omit<Patient, 'id' | 'created_at'>>
): Promise<Patient> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (patient.full_name !== undefined) {
    fields.push(`full_name = $${paramCount++}`);
    values.push(patient.full_name);
  }
  if (patient.national_id !== undefined) {
    fields.push(`national_id = $${paramCount++}`);
    values.push(patient.national_id);
  }
  if (patient.phone !== undefined) {
    fields.push(`phone = $${paramCount++}`);
    values.push(patient.phone);
  }
  if (patient.address !== undefined) {
    fields.push(`address = $${paramCount++}`);
    values.push(patient.address);
  }
  if (patient.city_id !== undefined) {
    fields.push(`city_id = $${paramCount++}`);
    values.push(patient.city_id);
  }
  if (patient.birth_date !== undefined) {
    fields.push(`birth_date = $${paramCount++}`);
    values.push(patient.birth_date);
  }
  if (patient.medical_history !== undefined) {
    fields.push(`medical_history = $${paramCount++}`);
    values.push(patient.medical_history);
  }

  values.push(id);

  return queryOne<Patient>(
    `UPDATE patients SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  ) as Promise<Patient>;
}

// ============ DOCTOR OPERATIONS ============
export async function getDoctors(): Promise<Doctor[]> {
  return queryAll<Doctor>(
    'SELECT * FROM doctors ORDER BY full_name ASC'
  );
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  return queryOne<Doctor>(
    'SELECT * FROM doctors WHERE id = $1',
    [id]
  );
}

export async function createDoctor(
  doctor: Omit<Doctor, 'id' | 'created_at'>
): Promise<Doctor> {
  return queryOne<Doctor>(
    `INSERT INTO doctors (full_name, national_id, birth_date, active)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [doctor.full_name, doctor.national_id, doctor.birth_date, doctor.active]
  ) as Promise<Doctor>;
}

// ============ TREATMENT OPERATIONS ============
export async function getTreatments(): Promise<Treatment[]> {
  return queryAll<Treatment>(
    'SELECT * FROM treatments ORDER BY name ASC'
  );
}

export async function createTreatment(
  treatment: Omit<Treatment, 'id' | 'created_at'>
): Promise<Treatment> {
  return queryOne<Treatment>(
    `INSERT INTO treatments (name, description, base_price, active)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [treatment.name, treatment.description, treatment.base_price, treatment.active]
  ) as Promise<Treatment>;
}

// ============ PROCEDURE OPERATIONS ============
export async function getProcedureById(id: string): Promise<ProcedureDetail | null> {
  const procedure = await queryOne<Procedure>(
    'SELECT * FROM procedures WHERE id = $1',
    [id]
  );

  if (!procedure) return null;

  return getProcedureDetails(id);
}

export async function getProcedureDetails(id: string): Promise<ProcedureDetail> {
  const procedure = await queryOne<Procedure>(
    `SELECT p.*, t.name as treatment_name, t.description as treatment_description
     FROM procedures p
     LEFT JOIN treatments t ON p.treatment_id = t.id
     WHERE p.id = $1`,
    [id]
  );

  if (!procedure) {
    throw new Error('Procedure not found');
  }

  const sessions = await queryAll<Session>(
    'SELECT * FROM procedure_sessions WHERE procedure_id = $1 ORDER BY session_number ASC',
    [id]
  );

  const payments = await queryAll<any>(
    `SELECT p.*, pm.name as payment_method_name
     FROM payments p
     LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
     WHERE p.procedure_id = $1
     ORDER BY p.payment_date ASC`,
    [id]
  );

  // Calcular total pagado (parseando correctamente los números)
  const totalPaid = payments.reduce((sum, p) => {
    const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Asegurar que total_cost es un número
  const totalCost = typeof procedure.total_cost === 'string' 
    ? parseFloat(procedure.total_cost) 
    : procedure.total_cost || 0;

  const totalPending = totalCost - totalPaid;

  return {
    ...procedure,
    treatment: procedure.treatment_id ? {
      id: procedure.treatment_id,
      name: procedure.treatment_name,
      description: procedure.treatment_description,
      base_price: 0,
      active: true,
      created_at: new Date().toISOString(),
    } : undefined,
    sessions: sessions || [],
    payments: payments || [],
    totalPaid,
    totalPending,
  } as ProcedureDetail;
}

export async function createProcedure(
  procedure: Omit<Procedure, 'id' | 'created_at'>
): Promise<Procedure> {
  return queryOne<Procedure>(
    `INSERT INTO procedures (patient_id, treatment_id, tooth_code, diagnosis, total_cost, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      procedure.patient_id,
      procedure.treatment_id,
      procedure.tooth_code,
      procedure.diagnosis,
      procedure.total_cost,
      procedure.status,
      procedure.start_date,
      procedure.end_date,
    ]
  ) as Promise<Procedure>;
}

export async function updateProcedure(
  id: string,
  procedure: Partial<Omit<Procedure, 'id' | 'created_at'>>
): Promise<Procedure> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (procedure.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(procedure.status);
  }
  if (procedure.diagnosis !== undefined) {
    fields.push(`diagnosis = $${paramCount++}`);
    values.push(procedure.diagnosis);
  }
  if (procedure.total_cost !== undefined) {
    fields.push(`total_cost = $${paramCount++}`);
    values.push(procedure.total_cost);
  }
  if (procedure.start_date !== undefined) {
    fields.push(`start_date = $${paramCount++}`);
    values.push(procedure.start_date);
  }
  if (procedure.end_date !== undefined) {
    fields.push(`end_date = $${paramCount++}`);
    values.push(procedure.end_date);
  }

  values.push(id);

  return queryOne<Procedure>(
    `UPDATE procedures SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  ) as Promise<Procedure>;
}

// ============ APPOINTMENT OPERATIONS ============
export async function getAppointments(
  limit: number = 50,
  offset: number = 0,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ appointments: AppointmentDetail[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM appointments'
  );

  const total = parseInt(countResult?.count || '0');

  const appointmentRows = await queryAll<any>(
    `SELECT a.*, p.full_name as patient_name, d.full_name as doctor_name
     FROM appointments a
     LEFT JOIN patients p ON a.patient_id = p.id
     LEFT JOIN doctors d ON a.doctor_id = d.id
     ORDER BY a.appointment_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const appointments: AppointmentDetail[] = appointmentRows.map((row) => ({
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    appointment_date: row.appointment_date,
    status: row.status,
    general_notes: row.general_notes,
    created_at: row.created_at,
    patient: { id: row.patient_id, full_name: row.patient_name } as any,
    doctor: { id: row.doctor_id, full_name: row.doctor_name } as any,
    sessions: [],
  }));

  return { appointments, total };
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  return queryAll<Appointment>(
    'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC',
    [patientId]
  );
}

export async function getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
  return queryAll<Appointment>(
    'SELECT * FROM appointments WHERE doctor_id = $1 ORDER BY appointment_date DESC',
    [doctorId]
  );
}

export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'created_at'>
): Promise<Appointment> {
  return queryOne<Appointment>(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, general_notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      appointment.patient_id,
      appointment.doctor_id,
      appointment.appointment_date,
      appointment.status,
      appointment.general_notes,
    ]
  ) as Promise<Appointment>;
}

export async function updateAppointment(
  id: string,
  appointment: Partial<Omit<Appointment, 'id' | 'created_at'>>
): Promise<Appointment> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (appointment.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(appointment.status);
  }
  if (appointment.general_notes !== undefined) {
    fields.push(`general_notes = $${paramCount++}`);
    values.push(appointment.general_notes);
  }

  values.push(id);

  return queryOne<Appointment>(
    `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  ) as Promise<Appointment>;
}

// ============ SESSION OPERATIONS ============
export async function getSessionsByProcedure(procedureId: string): Promise<Session[]> {
  return queryAll<Session>(
    'SELECT * FROM procedure_sessions WHERE procedure_id = $1 ORDER BY session_number ASC',
    [procedureId]
  );
}

export async function getLastSessionNumber(procedureId: string): Promise<number> {
  const result = await queryOne<{ session_number: number }>(
    'SELECT session_number FROM procedure_sessions WHERE procedure_id = $1 ORDER BY session_number DESC LIMIT 1',
    [procedureId]
  );
  return result?.session_number || 0;
}

export async function createSession(
  session: Omit<Session, 'id' | 'created_at'>
): Promise<Session> {
  return queryOne<Session>(
    `INSERT INTO procedure_sessions (procedure_id, appointment_id, session_number, progress_notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      session.procedure_id,
      session.appointment_id,
      session.session_number,
      session.progress_notes || '',
    ]
  ) as Promise<Session>;
}

// ============ PAYMENT OPERATIONS ============
export async function getPaymentsByProcedure(procedureId: string): Promise<Payment[]> {
  return queryAll<Payment>(
    `SELECT p.*, pm.name as payment_method_name
     FROM payments p
     LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
     WHERE p.procedure_id = $1
     ORDER BY p.payment_date ASC`,
    [procedureId]
  );
}

export async function createPayment(
  payment: Omit<Payment, 'id' | 'created_at'>
): Promise<Payment> {
  return queryOne<Payment>(
    `INSERT INTO payments (procedure_id, payment_method_id, amount, transaction_reference, payment_date)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [
      payment.procedure_id,
      payment.payment_method_id,
      payment.amount,
      payment.transaction_reference,
    ]
  ) as Promise<Payment>;
}

// ============ PAYMENT METHODS OPERATIONS ============
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return queryAll<PaymentMethod>(
    'SELECT * FROM payment_methods WHERE active = true ORDER BY name ASC'
  );
}
