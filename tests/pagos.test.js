import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { estadoPlan, superaLimitePacientes } from "../src/app/plan.js";
import { estadoDesdeStripe, filaSuscripcion, firmaValida, formulario } from "../api/_pagos.js";

const DIA = 86400000;
const ahora = new Date("2027-01-15T12:00:00Z");

describe("estadoPlan", () => {
  it("prueba de 90 días desde que se crea la clínica", () => {
    const e = estadoPlan({ clinica: { creado_en: new Date(ahora - 80 * DIA).toISOString() }, ahora });
    expect(e.plan).toBe("prueba"); expect(e.diasPrueba).toBe(10); expect(e.soloLectura).toBe(false);
  });
  it("sin suscripción tras la prueba: solo lectura", () => {
    const e = estadoPlan({ clinica: { creado_en: new Date(ahora - 91 * DIA).toISOString() }, ahora });
    expect(e.plan).toBe("caducado"); expect(e.soloLectura).toBe(true);
  });
  it("Básico: límite de 10 pacientes", () => {
    const e = estadoPlan({ clinica: {}, suscripcion: { plan: "basico", estado: "activa" }, ahora });
    expect(e.limitePacientes).toBe(10); expect(e.maxProfesionales).toBe(1);
  });
  it("impago: 14 días de gracia y luego solo lectura", () => {
    const clinica = { creado_en: "2025-01-01" };
    const dentro = estadoPlan({ clinica, suscripcion: { plan: "profesional", estado: "impagada", fin_periodo: new Date(ahora - 10 * DIA).toISOString() }, ahora });
    expect(dentro.plan).toBe("profesional"); expect(dentro.impago).toBe(true);
    const fuera = estadoPlan({ clinica, suscripcion: { plan: "profesional", estado: "impagada", fin_periodo: new Date(ahora - 20 * DIA).toISOString() }, ahora });
    expect(fuera.plan).toBe("caducado");
  });
  it("Clínica: 3 profesionales más los extra", () => {
    expect(estadoPlan({ clinica: {}, suscripcion: { plan: "clinica", estado: "activa", profesionales_extra: 2 }, ahora }).maxProfesionales).toBe(5);
  });
});

describe("superaLimitePacientes", () => {
  const pacientes = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }));
  const citas = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, pacienteId: i + 1, fecha: "2027-01-10" }));
  it("no deja activar al paciente 11", () => {
    const despues = [...citas, { id: 99, pacienteId: 11, fecha: "2027-01-20" }];
    expect(superaLimitePacientes({ limite: 10, citasAntes: citas, citasDespues: despues, pacientesAntes: pacientes, pacientesDespues: pacientes, ahora })).toBe(true);
  });
  it("sí deja más citas a pacientes ya activos", () => {
    const despues = [...citas, { id: 99, pacienteId: 3, fecha: "2027-01-20" }];
    expect(superaLimitePacientes({ limite: 10, citasAntes: citas, citasDespues: despues, pacientesAntes: pacientes, pacientesDespues: pacientes, ahora })).toBe(false);
  });
});

describe("Stripe", () => {
  it("codifica formularios anidados", () => {
    expect(formulario({ a: { 0: { b: 1 } }, c: "x y" })).toBe("a%5B0%5D%5Bb%5D=1&c=x%20y");
  });
  it("comprueba la firma del webhook", () => {
    const secreto = "whsec_prueba", cuerpo = '{"id":"evt_1"}', t = Math.floor(Date.now() / 1000);
    const firma = crypto.createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex");
    expect(firmaValida(cuerpo, `t=${t},v1=${firma}`, secreto)).toBe(true);
    expect(firmaValida(cuerpo + " ", `t=${t},v1=${firma}`, secreto)).toBe(false);
    expect(firmaValida(cuerpo, `t=${t - 1000},v1=${firma}`, secreto)).toBe(false);
  });
  it("traduce la suscripción de Stripe a una fila", () => {
    const f = filaSuscripcion({ id: "sub_1", customer: "cus_1", status: "past_due", current_period_end: 1800000000, metadata: { clinica_id: "c1", plan: "clinica", periodo: "anual", extra: "2" } });
    expect(f).toMatchObject({ clinica_id: "c1", plan: "clinica", periodo: "anual", estado: "impagada", profesionales_extra: 2, stripe_customer_id: "cus_1" });
    expect(estadoDesdeStripe("canceled")).toBe("cancelada");
  });
});
