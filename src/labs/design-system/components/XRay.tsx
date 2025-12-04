import { createContext, useContext, useState, type ReactNode } from 'react';

type XRayContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const XRayContext = createContext<XRayContextValue>({
  enabled: false,
  toggle: () => {},
});

export function useXRay() {
  return useContext(XRayContext);
}

type XRayProps = {
  children: ReactNode;
  defaultEnabled?: boolean;
};

export function XRay({ children, defaultEnabled = false }: XRayProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const toggle = () => setEnabled((e) => !e);

  return (
    <XRayContext.Provider value={{ enabled, toggle }}>
      <div className="xray-container" data-xray={enabled}>
        <button
          type="button"
          className="xray-toggle"
          onClick={toggle}
          aria-pressed={enabled}
        >
          {enabled ? 'X-Ray On' : 'X-Ray Off'}
        </button>
        <div className="xray-content">{children}</div>
      </div>
    </XRayContext.Provider>
  );
}
