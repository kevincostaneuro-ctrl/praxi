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
