import type { ReactNode } from "react";

type DeviceShellProps = {
  children: ReactNode;
};

export function DeviceShell({ children }: DeviceShellProps) {
  return (
    <div className="device-stage">
      <div className="device-console">
        <div className="device-display">
          <div className="device-screen-hud" aria-hidden="true">
            <span>Lee Notes</span>
            <span>Knowledge Workspace</span>
            <span>Public</span>
          </div>
          <div className="device-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}
