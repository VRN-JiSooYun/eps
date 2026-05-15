import { ChevronDown } from "lucide-react";
import { SelectHTMLAttributes } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label: string;
  options: Option[];
  requiredMark?: boolean;
};

export function SelectField({ className = "", error, id, label, options, requiredMark = false, ...props }: SelectFieldProps) {
  const fieldId = id ?? props.name ?? label;

  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-gray-900">
        {label} {requiredMark ? <span className="text-voronoi-orange">*</span> : null}
      </span>
      <span className="relative block">
        <select
          id={fieldId}
          className={`w-full appearance-none rounded border bg-white px-4 py-3 pr-10 text-gray-900 outline-none transition-colors focus:border-voronoi-orange focus:ring-1 focus:ring-voronoi-orange ${
            error ? "border-red-400" : "border-gray-200"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        >
          <option value="" />
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      </span>
      {error ? (
        <span className="mt-2 block text-sm text-red-600" id={`${fieldId}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
