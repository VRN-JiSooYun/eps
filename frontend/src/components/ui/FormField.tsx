import { Form, Input } from "antd";
import type { InputProps } from "antd";

type FormFieldProps = InputProps & {
  error?: string;
  label: string;
  requiredMark?: boolean;
};

export function FormField({ className = "", error, id, label, requiredMark = false, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name ?? label;
  const input = props.type === "password" ? <Input.Password id={fieldId} className={className} {...props} /> : <Input id={fieldId} className={className} {...props} />;

  return (
    <Form.Item
      className="mb-0"
      colon={false}
      help={error}
      label={
        <span className="text-base font-medium text-gray-900">
          {label} {requiredMark ? <span className="text-voronoi-orange">*</span> : null}
        </span>
      }
      validateStatus={error ? "error" : undefined}
    >
      {input}
    </Form.Item>
  );
}
