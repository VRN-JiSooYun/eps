import { ArrowLeft, ArrowRight } from "lucide-react";
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

export function ContactInfoForm({ errors, onBack, onChange, onNext, submitting = false, values }: ContactInfoFormProps) {
  return (
    <div className="mt-4">
      {errors.submit ? <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{errors.submit}</p> : null}
      <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <FormField error={errors.contactName} label="이름" name="contactName" onChange={(event) => onChange("contactName", event.target.value)} requiredMark type="text" value={values.contactName} />
        <FormField error={errors.position} label="직위" name="position" onChange={(event) => onChange("position", event.target.value)} requiredMark type="text" value={values.position} />
        <FormField error={errors.department} label="부서" name="department" onChange={(event) => onChange("department", event.target.value)} requiredMark type="text" value={values.department} />
        <FormField error={errors.mobilePhone} label="휴대폰번호" name="mobilePhone" onChange={(event) => onChange("mobilePhone", event.target.value)} requiredMark type="tel" value={values.mobilePhone} />
        <FormField error={errors.directPhone} label="직통번호" name="directPhone" onChange={(event) => onChange("directPhone", event.target.value)} type="tel" value={values.directPhone} />

        <label className="block">
          <span className="mb-2 flex items-start justify-between gap-4 text-base font-medium text-gray-900">
            <span>
              이메일 <span className="text-voronoi-orange">*</span>
            </span>
            <span className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-normal text-gray-600">
              <input
                checked={values.emailNotificationEnabled}
                className="h-4 w-4 rounded border-gray-300 accent-voronoi-orange focus:ring-voronoi-orange"
                name="emailNotificationEnabled"
                onChange={(event) => onChange("emailNotificationEnabled", event.target.checked)}
                type="checkbox"
              />
              알림 여부
            </span>
          </span>
          <input
            className="w-full rounded border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-colors focus:border-voronoi-orange focus:ring-1 focus:ring-voronoi-orange"
            name="email"
            onChange={(event) => onChange("email", event.target.value)}
            type="email"
            value={values.email}
          />
          {errors.email ? <span className="mt-2 block text-sm text-red-600">{errors.email}</span> : null}
        </label>
      </div>

      <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
        <Button type="button" className="text-lg" disabled={submitting} iconLeft={<ArrowLeft size={18} />} onClick={onBack}>
          이전
        </Button>
        <Button type="button" className="text-lg" disabled={submitting} iconRight={<ArrowRight size={18} />} onClick={onNext}>
          {submitting ? "등록 중" : "다음"}
        </Button>
      </div>
    </div>
  );
}
