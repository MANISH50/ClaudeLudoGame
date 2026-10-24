import { useEffect, useRef } from 'react';
import type { Settings, Theme } from '../settings/settings';
import { SegmentedControl } from './SegmentedControl';

export interface SettingsDrawerProps {
  readonly open: boolean;
  readonly settings: Settings;
  readonly onChange: (next: Settings) => void;
  readonly onClose: () => void;
}

// A native dialog gives focus trapping and Escape handling without extra code.
export function SettingsDrawer({ open, settings, onChange, onClose }: SettingsDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="drawer" aria-labelledby="settings-title" onClose={onClose}>
      <div className="drawer-body">
        <div className="drawer-header">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <SegmentedControl
          name="theme"
          legend="Theme"
          value={settings.theme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(value) => onChange({ ...settings, theme: value as Theme })}
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.autoMove}
            onChange={(event) => onChange({ ...settings, autoMove: event.target.checked })}
          />
          <span>
            <span className="toggle-title">Auto-move a sole legal move</span>
            <span className="toggle-sub">When you have only one legal move, play it for you.</span>
          </span>
        </label>
      </div>
    </dialog>
  );
}
