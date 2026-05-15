import { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
  requiredMark?: boolean;
};

export function FormField({ className = "", error, id, label, requiredMark = false, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name ?? label;

  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-gray-900">
        {label} {requiredMark ? <span className="text-voronoi-orange">*</span> : null}
      </span>
      <input
        id={fieldId}
        className={`w-full rounded border bg-white px-4 py-3 text-gray-900 outline-none transition-colors focus:border-voronoi-orange focus:ring-1 focus:ring-voronoi-orange ${
          error ? "border-red-400" : "border-gray-200"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error ? (
        <span className="mt-2 block text-sm text-red-600" id={`${fieldId}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
