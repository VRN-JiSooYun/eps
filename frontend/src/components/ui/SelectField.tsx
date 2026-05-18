import { Form, Select } from "antd";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  className?: string;
  error?: string;
  label: string;
  name?: string;
  onChange: (value: string) => void;
  options: Option[];
  requiredMark?: boolean;
  value: string;
};

export function SelectField({ className = "", error, label, onChange, options, requiredMark = false, value }: SelectFieldProps) {
  return (
    <Form.Item
      className="eps-register-field mb-0"
      colon={false}
      help={error}
      label={
        <span className="text-base font-medium text-gray-900">
          {label} {requiredMark ? <span className="text-voronoi-orange">*</span> : null}
        </span>
      }
      validateStatus={error ? "error" : undefined}
    >
      <Select allowClear className={className} options={options} onChange={(nextValue) => onChange(nextValue ?? "")} value={value || undefined} />
    </Form.Item>
  );
}
