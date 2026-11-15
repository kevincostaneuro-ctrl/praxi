import { describe, it, expect } from "vitest";
import { addDays, today, toYMD, diasEntre, etiquetaDia, etiquetaSemana, telWhatsApp, mensajeCita,
  timeToMins, minsToTime, fechaES, eur2 } from "../src/app/utilidades.js";
import { crearSeudonimos } from "../src/app/ia.jsx";

describe("fechas", () => {
  it("formatea y cuenta días", () => {
    expect(toYMD(new Date(2027, 0, 5))).toBe("2027-01-05");
    expect(diasEntre(new Date(2027, 0, 5), new Date(2027, 0, 8))).toBe(3);
    expect(fechaES("2027-01-05")).toBe("05/01/2027");
  });
  it("etiqueta hoy, mañana y ayer", () => {
    expect(etiquetaDia(today())).toBe("Hoy");
    expect(etiquetaDia(addDays(today(), 1))).toBe("Mañana");
    expect(etiquetaDia(addDays(today(), -1))).toBe("Ayer");
  });
  it("etiqueta semanas", () => {
    expect(etiquetaSemana(today())).toBe("Esta semana");
    expect(etiquetaSemana(addDays(today(), 7))).toBe("Siguiente");
    expect(etiquetaSemana(addDays(today(), -7))).toBe("Anterior");
  });
  it("convierte horas", () => {
    expect(timeToMins("09:30")).toBe(570);
    expect(minsToTime(570)).toBe("09:30");
  });
});

describe("WhatsApp", () => {
  it("normaliza teléfonos españoles", () => {
    expect(telWhatsApp("600 11 22 33")).toBe("34600112233");
    expect(telWhatsApp("+34 600112233")).toBe("34600112233");
    expect(telWhatsApp("0034600112233")).toBe("34600112233");
  });
  it("el mensaje de cita lleva fecha, hora y enlace", () => {
    const m = mensajeCita("Lucía", "2027-01-05", "10:00", "https://meet.google.com/x");
    expect(m).toContain("Lucía");
    expect(m).toContain("10:00");
    expect(m).toContain("https://meet.google.com/x");
  });
});

describe("importes", () => {
  it("formatea euros con dos decimales", () => {
    expect(eur2(50).replace(/\s/g, " ")).toBe("50,00 €");
  });
});

describe("seudónimos para la IA", () => {
  it("oculta y recupera los nombres de los pacientes", () => {
    const { enmascarar, desenmascarar } = crearSeudonimos([{ nombre: "Lucía", apellidos: "Martín", alias: "Paciente 1" }]);
    const oculto = enmascarar("Sesión con Lucía Martín");
    expect(oculto).not.toContain("Lucía");
    expect(oculto).toContain("Paciente 1");
    expect(desenmascarar(oculto)).toContain("Lucía Martín");
  });
});
