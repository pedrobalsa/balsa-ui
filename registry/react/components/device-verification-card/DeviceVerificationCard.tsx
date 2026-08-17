import { useState, type HTMLAttributes, type MouseEvent } from "react";
import { Button } from "../ui/Button";
import { InputOTP } from "../ui/InputOTP";
import { Link } from "../ui/Link";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface DeviceVerificationCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  length?: number;
  onVerify?: (code: string) => void;
  onResend?: () => void;
}

export function DeviceVerificationCard({
  title = "Confirm this device",
  description = "Enter the six digits sent to ada@example.com.",
  length = 6,
  headingLevel,
  shadow,
  theme,
  onVerify,
  onResend,
  "data-balsa": _dataBalsa,
  ...domProps
}: DeviceVerificationCardProps) {
  void _dataBalsa;
  const [code, setCode] = useState("");
  const complete = code.length === length;

  function handleResend(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onResend?.();
  }

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="device-verification"
      footer={(
        <Button className="w-full" disabled={!complete} onClick={() => onVerify?.(code)}>
          Verify device
        </Button>
      )}
    >
      <InputOTP
        id="device-code"
        value={code}
        onValueChange={setCode}
        label="Verification code"
        length={length}
        grouped
        fluid
        separatorEvery={3}
      />
      <p className="mt-balsa-lg text-xs text-balsa-muted-foreground">
        The code expires in 10 minutes.{" "}
        <Link href="#" onClick={handleResend}>Send it again</Link>
      </p>
    </CompositionRoot>
  );
}
