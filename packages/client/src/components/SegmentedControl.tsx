export interface SegmentOption {
  readonly value: string;
  readonly label: string;
}

export interface SegmentedControlProps {
  readonly name: string;
  readonly legend: string;
  readonly options: readonly SegmentOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

// Radio group styled as pills. Native radios keep arrow-key and screen-reader behaviour for free.
export function SegmentedControl({ name, legend, options, value, onChange }: SegmentedControlProps) {
  return (
    <fieldset className="segmented">
      <legend className="segmented-legend">{legend}</legend>
      <div className="segmented-options">
        {options.map((option) => (
          <label key={option.value} className={`segment${value === option.value ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
