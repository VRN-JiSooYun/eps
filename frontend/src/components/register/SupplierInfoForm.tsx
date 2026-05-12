import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { SelectField } from "../ui/SelectField";
import { FileUploadBox } from "./FileUploadBox";

const bankOptions = [
  { label: "은행 1", value: "bank1" },
  { label: "은행 2", value: "bank2" }
];

type SupplierInfoFormProps = {
  onBack?: () => void;
  onNext?: () => void;
};

export function SupplierInfoForm({ onBack, onNext }: SupplierInfoFormProps) {
  return (
    <div className="mt-4">
      <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <FormField label="업체명" name="companyName" requiredMark type="text" />
        <FormField label="사업자등록번호" name="businessRegistrationNumber" requiredMark type="text" />
        <FormField label="본사전화번호" name="headOfficePhone" requiredMark type="tel" />
        <SelectField label="거래은행" name="bankName" options={bankOptions} requiredMark />
        <FormField label="예금주" name="accountHolder" requiredMark type="text" />
        <FormField label="계좌번호" name="accountNumber" requiredMark type="text" />
        <FormField label="비밀번호" name="password" requiredMark type="password" />
        <FormField label="비밀번호 확인" name="passwordConfirm" requiredMark type="password" />
      </div>

      <section className="mb-12">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">첨부파일</h2>
          <p className="mt-1 text-sm text-gray-500">※ 사업자등록증, 통장사본 필수 제출</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FileUploadBox label="사업자등록증" />
          <FileUploadBox label="통장사본" />
        </div>
      </section>

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
