// Planes de Praxi: qué tiene cada clínica y qué puede hacer.
// Copia en el navegador de la lógica de supabase/09_suscripciones.sql (la base de datos
// es la que manda: aquí solo se usa para enseñar avisos y bloquear antes de guardar).
export const DIAS_PRUEBA = 90;
export const DIAS_GRACIA = 14;
export const LIMITE_PACIENTES_BASICO = 10;

// Precios finales, IVA incluido
export const PLANES = {
  basico: { nombre: "Básico", mensual: 9.99, anual: null, pacientes: LIMITE_PACIENTES_BASICO, profesionales: 1, nora: "Incluida, igual que en todos los planes" },
  profesional: { nombre: "Profesional", mensual: 24, anual: 240, pacientes: null, profesionales: 1, nora: "Sin límite práctico" },
  fundador: { nombre: "Profesional · fundador", mensual: 15, anual: null, pacientes: null, profesionales: 1, nora: "Sin límite práctico" },
  clinica: { nombre: "Clínica", mensual: 59, anual: 590, pacientes: null, profesionales: 3, extra: 19, nora: "Sin límite práctico" },
};

const DIA = 24 * 60 * 60 * 1000;

// → { plan: 'prueba'|'basico'|'profesional'|'fundador'|'clinica'|'caducado', diasPrueba, soloLectura, limitePacientes, maxProfesionales, impago }
export function estadoPlan({ clinica, suscripcion, ahora = new Date(), demo = false }) {
  if (demo) return { plan: "prueba", diasPrueba: DIAS_PRUEBA, soloLectura: false, limitePacientes: null, maxProfesionales: null, impago: false };
  const s = suscripcion;
  const finGracia = s?.fin_periodo ? new Date(s.fin_periodo).getTime() + DIAS_GRACIA * DIA : ahora.getTime();
  const vigente = s && (["activa", "cortesia"].includes(s.estado) || (["impagada", "cancelada"].includes(s.estado) && ahora.getTime() < finGracia));
  if (vigente) {
    const p = PLANES[s.plan] || PLANES.profesional;
    return { plan: s.plan, diasPrueba: 0, soloLectura: false, limitePacientes: p.pacientes, maxProfesionales: s.plan === "clinica" ? 3 + (s.profesionales_extra || 0) : 1, impago: s.estado === "impagada" };
  }
  const inicio = clinica?.creado_en ? new Date(clinica.creado_en).getTime() : ahora.getTime();
  const diasPrueba = Math.ceil((inicio + DIAS_PRUEBA * DIA - ahora.getTime()) / DIA);
  if (diasPrueba > 0) return { plan: "prueba", diasPrueba, soloLectura: false, limitePacientes: null, maxProfesionales: null, impago: false };
  return { plan: "caducado", diasPrueba: 0, soloLectura: true, limitePacientes: null, maxProfesionales: null, impago: false };
}

// Pacientes activos: con cita o sesión en los últimos 90 días (o con cita futura)
export function idsPacientesActivos(patients, citas, ahora = new Date()) {
  const desde = new Date(ahora.getTime() - 90 * DIA).toISOString().slice(0, 10);
  const ids = new Set();
  citas.forEach(c => { if (c.pacienteId && c.fecha >= desde) ids.add(String(c.pacienteId)); });
  patients.forEach(p => { if ((p.sesiones || []).some(s => (s.fecha || "") >= desde)) ids.add(String(p.id)); });
  return ids;
}

// ¿Este cambio activa a un paciente nuevo por encima del límite del plan Básico?
export function superaLimitePacientes({ limite, patients, citasAntes, citasDespues, pacientesAntes, pacientesDespues, ahora = new Date() }) {
  if (!limite) return false;
  const antes = idsPacientesActivos(pacientesAntes || patients, citasAntes, ahora);
  const despues = idsPacientesActivos(pacientesDespues || patients, citasDespues, ahora);
  const nuevos = [...despues].filter(id => !antes.has(id));
  return nuevos.length > 0 && despues.size > limite;
}
