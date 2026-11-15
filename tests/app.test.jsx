// Prueba de humo: abre la demo y recorre todas las pantallas.
// Si un cambio rompe una pantalla (como la pantalla en blanco de «Nueva cita»), esta prueba falla.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App.jsx";

const PANTALLAS = ["Calendario", "Pacientes", "Facturas", "Recursos", "Equipo", "Configuración", "Dashboard"];

async function abrirDemo() {
  const errores = [];
  const espia = vi.spyOn(console, "error").mockImplementation((...a) => errores.push(a.map(String).join(" ")));
  await act(async () => {
    render(<MemoryRouter initialEntries={["/demo"]}><App demo /></MemoryRouter>);
  });
  return { errores, espia };
}

function ir(nombre) {
  const el = screen.getAllByText(new RegExp(`▪\\s*${nombre}$`))[0];
  fireEvent.click(el);
}

describe("demo", () => {
  it("se abre y recorre todas las pantallas sin errores", async () => {
    const { errores, espia } = await abrirDemo();
    for (const p of PANTALLAS) {
      await act(async () => ir(p));
      expect(document.body.textContent.length).toBeGreaterThan(200);
    }
    espia.mockRestore();
    expect(errores.filter(e => !/act\(|not wrapped/.test(e))).toEqual([]);
  });

  it("abre el formulario de nueva cita", async () => {
    const { espia } = await abrirDemo();
    await act(async () => ir("Calendario"));
    const boton = screen.getAllByRole("button").find(b => /Nueva cita|Añadir/.test(b.textContent));
    expect(boton).toBeTruthy();
    await act(async () => fireEvent.click(boton));
    expect(document.body.textContent).toContain("Nueva cita");
    espia.mockRestore();
  });

  it("abre la ficha de un paciente", async () => {
    const { espia } = await abrirDemo();
    await act(async () => ir("Pacientes"));
    const fila = document.querySelector("table tbody tr");
    expect(fila).toBeTruthy();
    await act(async () => fireEvent.click(fila));
    expect(document.body.textContent).toMatch(/Sesiones|Historia/);
    espia.mockRestore();
  });

  it("el dashboard muestra primeros pasos, citas de hoy, cobros y plan", async () => {
    const { espia } = await abrirDemo();
    const t = document.body.textContent;
    for (const bloque of ["Primeros pasos", "Citas de hoy", "Cobros pendientes", "Tu plan"]) expect(t).toContain(bloque);
    const factura = screen.getAllByRole("button").find(b => b.textContent === "Factura");
    await act(async () => fireEvent.click(factura));
    expect(document.body.textContent).toMatch(/Descargar/);
    espia.mockRestore();
  });
});
