import * as React from "react";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}) => {
  const handleToggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div className={`border rounded px-2 py-1 bg-white ${className}`} style={{ minWidth: 180 }}>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.length === 0 && (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {value.map((val) => {
          const opt = options.find((o) => o.value === val);
          return (
            <span key={val} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs flex items-center">
              {opt?.label || val}
              <button
                type="button"
                className="ml-1 text-blue-500 hover:text-blue-700"
                onClick={() => handleToggle(val)}
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="max-h-40 overflow-y-auto border-t pt-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
