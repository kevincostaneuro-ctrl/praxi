import { describe, expect, it } from "vitest";
import { ALIAS, anadirNota, fichaTexto, instruccion, leerRecursos, REGLAS_NORA } from "../src/app/nora.jsx";

const paciente = { id: 7, nombre: "Lucía", apellidos: "Martín", fechaNacimiento: "1990-05-01", estado: "activo", motivoConsulta: "Ansiedad en el trabajo",
  sesiones: [{ id: 1, numero: 1, fecha: "2026-11-02", trabajado: "Psicoeducación de la ansiedad" }], objetivos: [], pruebasRealizadas: [{ fecha: "2026-11-02", prueba: "GAD-7", resultado: "15" }] };

describe("Nora", () => {
  it("no envía el nombre ni la fecha de nacimiento en la ficha", () => {
    const t = fichaTexto(paciente);
    expect(t).not.toMatch(/Lucía|Martín|1990-05-01/);
    expect(t).toContain(ALIAS);
    expect(t).toContain("GAD-7: 15");
  });
  it("tiene prohibido diagnosticar y valorar el riesgo", () => {
    expect(REGLAS_NORA).toMatch(/No propones diagnósticos/);
    expect(REGLAS_NORA).toMatch(/no valoras el nivel de riesgo/);
  });
  it("prepara cada tarea", () => {
    expect(instruccion("nota", { notas: "dice que duerme mal" })).toContain("dice que duerme mal");
    expect(instruccion("documento", { documento: "derivacion" })).toContain("Informe de derivación");
    expect(instruccion("recursos")).toContain("PAC-21 |");
  });
  it("lee las recomendaciones de recursos y descarta códigos inventados", () => {
    const r = leerRecursos("PAC-03 | Entender la ansiedad\n- PAC-99 | no existe\n2. pro-02 | Seguir el GAD-7\nPAC-03 | repetido");
    expect(r.map(x => x.recurso.codigo)).toEqual(["PAC-03", "PRO-02"]);
    expect(r[1].motivo).toBe("Seguir el GAD-7");
  });
  it("guarda la nota en una sesión existente o crea la de hoy", () => {
    expect(anadirNota(paciente, "S · Subjetivo", 1).sesiones[0].trabajado).toBe("Psicoeducación de la ansiedad\n\nS · Subjetivo");
    const nueva = anadirNota(paciente, "nota", "").sesiones[1];
    expect(nueva).toMatchObject({ numero: 2, trabajado: "nota", pago: 0, pagado: false });
  });
});

import { contextoApp, huecosLibres } from "../src/app/noraContexto.js";
describe("Nora en toda la app", () => {
  const lunes = new Date(2026, 10, 16, 8, 0); // lunes 16/11/2026
  const citas = [{ fecha: "2026-11-16", hora: "10:00", duracion: 60, tipo: "Seguimiento", pacienteId: 7 }, { fecha: "2026-11-16", hora: "12:30", duracion: 30, tipo: "Primera llamada", origen: "calendly", nombreExterno: "Ana" }];
  it("calcula los huecos libres sin fines de semana", () => {
    const h = huecosLibres(citas, { start: 9, end: 14 }, { desde: lunes, dias: 7 });
    expect(h[0]).toMatchObject({ fecha: "2026-11-16", tramos: ["09:00–10:00", "11:00–12:30", "13:00–14:00"] });
    expect(h.map(x => x.dia)).not.toContain("sábado");
    expect(h).toHaveLength(5);
  });
  it("arma el contexto sin nombres reales", () => {
    const t = contextoApp({ patients: [paciente], citas, tareas: [{ titulo: "Llamar al colegio", fecha: "2026-11-17", hecho: false }], horario: { start: 9, end: 14 }, ahora: lunes, alias: () => "Paciente 1" });
    expect(t).toContain("lunes 2026-11-16 10:00 · 60 min · Seguimiento · Paciente 1");
    expect(t).toContain("contacto externo");
    expect(t).toContain("Llamar al colegio");
    expect(t).not.toMatch(/Lucía|Martín/);
  });
});

import { leerAcciones, validarAccion } from "../src/app/noraContexto.js";
describe("acciones de Nora", () => {
  const lunes = new Date(2026, 10, 16, 8, 0);
  const tipos = [{ id: "t1", nombre: "Primera llamada", duracion: 30 }, { id: "t2", nombre: "Seguimiento", duracion: 60 }];
  const citas = [{ id: 50, fecha: "2026-11-17", hora: "10:00", duracion: 60, pacienteId: 7, tipo: "Seguimiento" }];
  const datos = { patients: [paciente], citas, tipos, horario: { start: 9, end: 20 }, pacientePorNumero: n => (n === 1 ? paciente : null), ahora: lunes };
  it("separa el texto de las acciones y descarta las mal formadas", () => {
    const r = leerAcciones('Te la paso al martes.\n[[ACCION]]{"accion":"mover_cita","cita":50,"fecha":"2026-11-18","hora":"11:00"}[[/ACCION]]\n[[ACCION]]{roto[[/ACCION]]');
    expect(r.texto).toBe("Te la paso al martes.");
    expect(r.acciones).toEqual([{ accion: "mover_cita", cita: 50, fecha: "2026-11-18", hora: "11:00" }]);
  });
  it("valida crear una cita y avisa de choques y fines de semana", () => {
    const ok = validarAccion({ accion: "crear_cita", paciente: 1, fecha: "2026-11-17", hora: "10:30", tipo: "seguimiento" }, datos);
    expect(ok.ok).toBe(true); expect(ok.tipo.id).toBe("t2");
    expect(ok.avisos.join(" ")).toMatch(/Coincide con otra cita a las 10:00/);
    expect(validarAccion({ accion: "crear_cita", paciente: 1, fecha: "2026-11-21", hora: "10:00" }, datos).avisos).toContain("Es fin de semana.");
    expect(validarAccion({ accion: "crear_cita", paciente: 9, fecha: "2026-11-17", hora: "12:00" }, datos).ok).toBe(false);
  });
  it("valida mover, cancelar y crear tareas", () => {
    expect(validarAccion({ accion: "mover_cita", cita: 50, fecha: "2026-11-18", hora: "12:00" }, datos)).toMatchObject({ ok: true, avisos: [] });
    expect(validarAccion({ accion: "cancelar_cita", cita: 999 }, datos).ok).toBe(false);
    expect(validarAccion({ accion: "crear_tarea", titulo: "Llamar a la gestoría", prioridad: "urgente" }, datos)).toMatchObject({ ok: true, prioridad: "media", hora: "09:00" });
  });
});

import { crearSeudonimos } from "../src/app/ia.jsx";
describe("seudónimos", () => {
  it("quita el artículo delante del nombre real y no confunde Paciente 1 con Paciente 10", () => {
    const s = crearSeudonimos([{ nombre: "Lucía", apellidos: "Martín", alias: "Paciente 1" }, { nombre: "Pedro", apellidos: "Gil", alias: "Paciente 10" }]);
    expect(s.desenmascarar("Solo el Paciente 1 y al Paciente 10; la cita del Paciente 1.")).toBe("Solo Lucía Martín y a Pedro Gil; la cita de Lucía Martín.");
  });
});

import { estiloNora } from "../src/app/noraContexto.js";
describe("estilo de Nora", () => {
  it("aplica las preferencias y avisa de que no anulan las reglas", () => {
    const t = estiloNora({ tono: "directo", extension: "breve", formato: "texto", trato: "tu", nombre: "Laura", instrucciones: "Horas en 24 h" });
    expect(t).toMatch(/nunca anula las reglas/);
    expect(t).toMatch(/directo y sin rodeos/);
    expect(t).toMatch(/Llámale «Laura»/);
    expect(t).toMatch(/Horas en 24 h/);
    expect(estiloNora(null)).toMatch(/profesional y neutro/);
  });
});

import { saludoNora } from "../src/app/noraContexto.js";
describe("saludo de Nora", () => {
  it("cambia según la hora y usa el nombre de pila", () => {
    expect(saludoNora({ nombre: "Laura Martín", ahora: new Date(2026, 10, 24, 9, 0), azar: () => 0 }).titulo).toBe("Buenos días, Laura");
    expect(saludoNora({ nombre: "Laura", ahora: new Date(2026, 10, 24, 17, 0), azar: () => 0 }).titulo).toBe("Buenas tardes, Laura");
    expect(saludoNora({ nombre: "", ahora: new Date(2026, 10, 24, 22, 0), azar: () => 0 }).titulo).toBe("Buenas noches");
  });
  it("tiene saludos propios del día de la semana", () => {
    const viernes = new Set(Array.from({ length: 40 }, (_, i) => saludoNora({ nombre: "Laura", ahora: new Date(2026, 10, 27, 12, 0), azar: () => i / 40 }).titulo));
    expect(viernes.has("¡Viernes ya, Laura!")).toBe(true);
    expect(viernes.has("¿Qué tal va la semana, Laura?")).toBe(true);
  });
});
