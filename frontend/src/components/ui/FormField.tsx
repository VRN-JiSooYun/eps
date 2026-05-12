import { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  requiredMark?: boolean;
};

export function FormField({ className = "", id, label, requiredMark = false, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name ?? label;

  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-gray-900">
        {label} {requiredMark ? <span className="text-voronoi-orange">*</span> : null}
      </span>
      <input
        id={fieldId}
        className={`w-full rounded border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-colors focus:border-voronoi-orange focus:ring-1 focus:ring-voronoi-orange ${className}`}
        {...props}
      />
    </label>
  );
}
