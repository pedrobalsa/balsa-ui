import { VisCrosshair } from "@unovis/react";
import type { NumericAccessor } from "@unovis/ts";

export interface ChartCrosshairProps<Datum> {
  x?: NumericAccessor<Datum>;
  y?: NumericAccessor<Datum> | NumericAccessor<Datum>[];
  yStacked?: NumericAccessor<Datum>[];
  template?: (datum: Datum, x: number | Date, data: Datum[], leftNearestDatumIndex?: number) => string | HTMLElement;
}

export function ChartCrosshair<Datum>(props: ChartCrosshairProps<Datum>) {
  return <VisCrosshair {...props} circleRadius={5} />;
}
