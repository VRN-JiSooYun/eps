import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";

type ContactInfoFormProps = {
  onBack?: () => void;
  onNext?: () => void;
};

export function ContactInfoForm({ onBack, onNext }: ContactInfoFormProps) {
  return (
    <div className="mt-4">
      <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <FormField label="이름" name="contactName" requiredMark type="text" />
        <FormField label="직위" name="position" requiredMark type="text" />
        <FormField label="부서" name="department" requiredMark type="text" />
        <FormField label="휴대폰번호" name="mobilePhone" requiredMark type="tel" />
        <FormField label="직통번호" name="directPhone" type="tel" />

        <label className="block">
          <span className="mb-2 flex items-start justify-between gap-4 text-base font-medium text-gray-900">
            <span>
              이메일 <span className="text-voronoi-orange">*</span>
            </span>
            <span className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-normal text-gray-600">
              <input className="h-4 w-4 rounded border-gray-300 accent-voronoi-orange focus:ring-voronoi-orange" name="emailNotificationEnabled" type="checkbox" />
              알림 여부
            </span>
          </span>
          <input
            className="w-full rounded border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-colors focus:border-voronoi-orange focus:ring-1 focus:ring-voronoi-orange"
            name="email"
            type="email"
          />
        </label>
      </div>

      <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
        <Button type="button" className="text-lg" iconLeft={<ArrowLeft size={18} />} onClick={onBack}>
          이전
        </Button>
        <Button type="button" className="text-lg" iconRight={<ArrowRight size={18} />} onClick={onNext}>
          다음
        </Button>
      </div>
    </div>
  );
}
