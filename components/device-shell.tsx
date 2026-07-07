import type { ReactNode } from "react";

type DeviceShellProps = {
  children: ReactNode;
};

export function DeviceShell({ children }: DeviceShellProps) {
  return (
    <div className="device-stage">
      <div className="device-console">
        <div className="device-console-top" aria-hidden="true">
          <div className="device-brand">
            <span className="device-led" />
            <span>LEE POCKET</span>
          </div>

          <div className="device-slot">
            <span />
          </div>

          <div className="device-status-cluster">
            <div className="device-status">
              <span>LEE-OS</span>
              <span className="device-status-dot" />
              <span>READY</span>
            </div>
            <div className="device-battery">
              <span />
            </div>
          </div>
        </div>

        <div className="device-display">
          <div className="device-screen-hud" aria-hidden="true">
            <span>SCREEN 01</span>
            <span>PUBLIC LOG</span>
            <span>PX-60</span>
          </div>
          <div className="device-screen">{children}</div>
        </div>

        <div className="device-controls" aria-hidden="true">
          <div className="device-dpad">
            <span className="device-dpad-v" />
            <span className="device-dpad-h" />
          </div>
          <div className="device-meta-buttons">
            <span>SELECT</span>
            <span>START</span>
          </div>
          <div className="device-action-buttons">
            <span>B</span>
            <span>A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
