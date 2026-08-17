import { type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface OrderLine {
  id: string;
  label: string;
  detail?: string;
  amount: string;
}

const defaultItems: readonly OrderLine[] = [
  { id: "pro", label: "Pro workspace", detail: "12 members", amount: "$240.00" },
  { id: "storage", label: "Additional storage", detail: "500 GB", amount: "$35.00" },
  { id: "regions", label: "Extra regions", detail: "3 beyond the plan", amount: "$45.00" },
  { id: "support", label: "Priority support", detail: "4 hour response", amount: "$60.00" },
  { id: "credit", label: "Annual commitment", detail: "-10% for 12 months", amount: "-$38.00" },
];

export interface OrderSummaryCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  items?: readonly OrderLine[];
  subtotal?: string;
  tax?: string;
  total?: string;
  onConfirm?: () => void;
}

export function OrderSummaryCard({
  title = "Order summary",
  description = "Review charges before confirming.",
  items = defaultItems,
  subtotal = "$342.00",
  tax = "$27.36",
  total = "$369.36",
  headingLevel,
  shadow,
  theme,
  onConfirm,
  "data-balsa": _dataBalsa,
  ...domProps
}: OrderSummaryCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="order-summary"
      footer={<Button className="w-full" onClick={onConfirm}>Confirm order</Button>}
    >
      <ul className="divide-y divide-balsa-border" role="list">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-balsa-lg py-balsa-md first:pt-0">
            <span>
              <strong className="block text-sm font-medium">{item.label}</strong>
              <span className="text-xs text-balsa-muted-foreground">{item.detail}</span>
            </span>
            <strong className="text-sm font-medium tabular-nums">{item.amount}</strong>
          </li>
        ))}
      </ul>
      <dl className="mt-balsa-lg divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-balsa-md text-sm">
        <div className="flex justify-between py-balsa-md">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{subtotal}</dd>
        </div>
        <div className="flex justify-between py-balsa-md">
          <dt>Tax</dt>
          <dd className="tabular-nums">{tax}</dd>
        </div>
        <div className="flex justify-between py-balsa-md font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{total}</dd>
        </div>
      </dl>
    </CompositionRoot>
  );
}
