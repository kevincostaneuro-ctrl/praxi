import { describe, expect, it } from "vitest";
import { fechaHoy, iniciales, valoresCampos, nombreArchivo } from "../src/app/personalizarPdf.js";

describe("personalización de recursos", () => {
  const paciente = { nombre: "Lucía", apellidos: "Martín Gómez" };
  it("usa el nombre completo en los recursos para el paciente", () => {
    const v = valoresCampos({ recurso: { cat: "paciente" }, paciente, profesional: "Ana Ruiz", clinica: "Centro Sol", fecha: "16/11/2026" });
    expect(v).toEqual({ paciente: "Lucía Martín Gómez", profesional: "Ana Ruiz", clinica: "Centro Sol", fecha: "16/11/2026" });
  });
  it("usa solo iniciales en los recursos para el profesional", () => {
    expect(valoresCampos({ recurso: { cat: "profesional" }, paciente }).paciente).toBe("L. M. G.");
    expect(iniciales({ nombre: "ana", apellidos: "" })).toBe("A.");
  });
  it("deja el paciente en blanco si no se elige", () => {
    expect(valoresCampos({ recurso: { cat: "paciente" } }).paciente).toBe("");
  });
  it("formatea la fecha y el nombre del archivo", () => {
    expect(fechaHoy(new Date(2026, 0, 5))).toBe("05/01/2026");
    expect(nombreArchivo({ url: "/recursos/pacientes/21-diario-de-sueno.pdf" }, { paciente: "Lucía Martín" })).toBe("21-diario-de-sueno-lucia-martin.pdf");
  });
});
