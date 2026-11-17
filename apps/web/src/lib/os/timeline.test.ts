import { describe, expect, it } from "vitest";
import { timeline } from "./timeline";

const today = new Date(Date.UTC(2026, 10, 17));

describe("timeline", () => {
  it("abarca desde enero del primer año hasta diciembre del año actual", () => {
    const result = timeline([{ start: "2022-10", end: "2022-12" }], today);
    expect(result.years).toEqual([2022, 2023, 2024, 2025, 2026]);
  });

  it("calcula posición y ancho en porcentaje incluyendo el mes final", () => {
    const [bar] = timeline(
      [{ start: "2024-01", end: "2024-12" }],
      new Date(Date.UTC(2025, 0, 15)),
    ).bars;
    // 2024-2025: 24 meses; enero-diciembre de 2024 ocupa la primera mitad.
    expect(bar).toEqual({ left: 0, width: 50 });
  });

  it("usa el mes actual cuando no hay fecha de fin", () => {
    const result = timeline(
      [
        { start: "2026-01", end: null },
        { start: "2025-01", end: "2025-12" },
      ],
      today,
    );
    // 24 meses (2025-2026); enero a noviembre de 2026 = 11 meses.
    expect(result.bars[0]).toEqual({ left: 50, width: (11 / 24) * 100 });
    expect(result.bars[1]).toEqual({ left: 0, width: 50 });
  });

  it("garantiza un ancho mínimo visible", () => {
    const result = timeline(
      [
        { start: "2010-01", end: "2010-01" },
        { start: "2026-01", end: null },
      ],
      today,
    );
    expect(result.bars[0]!.width).toBeGreaterThanOrEqual(1.5);
  });

  it("no tiene años ni barras sin periodos", () => {
    expect(timeline([], today)).toEqual({ years: [], bars: [] });
  });
});
