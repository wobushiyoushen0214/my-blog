import type { ReactNode } from "react";

type DeviceShellProps = {
  children: ReactNode;
};

export function DeviceShell({ children }: DeviceShellProps) {
  return <>{children}</>;
}
