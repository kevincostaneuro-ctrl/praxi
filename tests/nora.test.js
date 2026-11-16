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
