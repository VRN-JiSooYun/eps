import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Checkbox, Form, Input } from "antd";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import type { ContactInfoValues } from "../../types";

type ContactInfoFormProps = {
  errors: Partial<Record<keyof ContactInfoValues | "submit", string>>;
  onBack?: () => void;
  onChange: (name: keyof ContactInfoValues, value: string | boolean) => void;
  onNext?: () => void;
  submitting?: boolean;
  values: ContactInfoValues;
};
const contactInputClassName = "eps-supplier-field-height !h-11";

export function ContactInfoForm({
  errors,
  onBack,
  onChange,
  onNext,
  submitting = false,
  values,
}: ContactInfoFormProps) {
  return (
    <div className="mt-4">
      {errors.submit ? (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.submit}
        </p>
      ) : null}
      <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <FormField
          className={contactInputClassName}
          error={errors.contactName}
          label="이름"
          name="contactName"
          onChange={(event) => onChange("contactName", event.target.value)}
          requiredMark
          type="text"
          value={values.contactName}
        />
        <FormField
          className={contactInputClassName}
          error={errors.position}
          label="직위"
          name="position"
          onChange={(event) => onChange("position", event.target.value)}
          requiredMark
          type="text"
          value={values.position}
        />
        <FormField
          className={contactInputClassName}
          error={errors.department}
          label="부서"
          name="department"
          onChange={(event) => onChange("department", event.target.value)}
          requiredMark
          type="text"
          value={values.department}
        />
        <FormField
          className={contactInputClassName}
          error={errors.mobilePhone}
          label="휴대폰번호"
          name="mobilePhone"
          onChange={(event) => onChange("mobilePhone", event.target.value)}
          requiredMark
          type="tel"
          value={values.mobilePhone}
        />
        <FormField
          className={contactInputClassName}
          error={errors.directPhone}
          label="직통번호"
          name="directPhone"
          onChange={(event) => onChange("directPhone", event.target.value)}
          type="tel"
          value={values.directPhone}
        />

        <Form.Item
          className="eps-register-field mb-0"
          colon={false}
          help={errors.email}
          label={
            <span className="flex w-full items-start justify-between gap-4 text-base font-medium text-gray-900">
              <span>
                이메일 <span className="text-voronoi-orange">*</span>
              </span>
              <Checkbox
                checked={values.emailNotificationEnabled}
                name="emailNotificationEnabled"
                onChange={(event) =>
                  onChange("emailNotificationEnabled", event.target.checked)
                }
                className="shrink-0 text-sm font-normal text-gray-600"
              >
                알림 여부
              </Checkbox>
            </span>
          }
          validateStatus={errors.email ? "error" : undefined}
        >
          <Input
            className={contactInputClassName}
            name="email"
            onChange={(event) => onChange("email", event.target.value)}
            type="email"
            value={values.email}
          />
        </Form.Item>
      </div>

      <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
        <Button
          type="button"
          className="text-lg"
          disabled={submitting}
          iconLeft={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          이전
        </Button>
        <Button
          type="button"
          className="text-lg"
          disabled={submitting}
          iconRight={<ArrowRightOutlined />}
          onClick={onNext}
        >
          {submitting ? "등록 중" : "다음"}
        </Button>
      </div>
    </div>
  );
}
