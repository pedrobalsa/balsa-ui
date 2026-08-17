import { Plus } from "lucide-react";
import { useState, type HTMLAttributes } from "react";
import { Button } from "../ui/Button";
import { RadioGroup, type RadioGroupOption } from "../ui/RadioGroup";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

const defaultMethods: readonly RadioGroupOption[] = [
  { label: "Card on file", value: "card", description: "Charged on the first of each month" },
  { label: "Invoice", value: "invoice", description: "Net 30, sent to billing@example.com" },
  { label: "Prepaid credits", value: "credits", description: "4,200 credits remaining" },
];

export interface PaymentMethodCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  methods?: readonly RadioGroupOption[];
  onContinue?: (method: string) => void;
}

export function PaymentMethodCard({
  title = "Billing method",
  description = "How this workspace is invoiced.",
  methods = defaultMethods,
  headingLevel,
  shadow,
  theme,
  onContinue,
  "data-balsa": _dataBalsa,
  ...domProps
}: PaymentMethodCardProps) {
  void _dataBalsa;
  const [method, setMethod] = useState(methods[0]?.value || "");

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="payment-method"
      footer={
        <Button className="w-full" disabled={!method} onClick={() => onContinue?.(method)}>
          Save billing method
        </Button>
      }
    >
      <RadioGroup
        id="payment-method"
        label="Saved methods"
        options={methods}
        layout="cards"
        className="w-full"
        value={method}
        onValueChange={setMethod}
      />
      <Button className="mt-balsa-lg w-full" variant="soft" prefixIcon={Plus} onClick={() => setMethod("")}>
        Add another method
      </Button>
      <dl className="mt-balsa-xl divide-y divide-balsa-border rounded-balsa-control bg-balsa-muted px-balsa-md text-sm">
        <div className="flex justify-between py-balsa-md">
          <dt>Next invoice</dt>
          <dd className="tabular-nums">Sep 1, 2026</dd>
        </div>
        <div className="flex justify-between py-balsa-md">
          <dt>Estimated</dt>
          <dd className="tabular-nums">$297.00</dd>
        </div>
        <div className="flex justify-between py-balsa-md">
          <dt>Billing contact</dt>
          <dd className="truncate">billing@example.com</dd>
        </div>
      </dl>
    </CompositionRoot>
  );
}
