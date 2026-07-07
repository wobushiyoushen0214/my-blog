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
            <span>LEE/NOTES</span>
            <span>PIXEL WORKSPACE</span>
            <span>ONLINE</span>
          </div>
          <div className="device-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}
