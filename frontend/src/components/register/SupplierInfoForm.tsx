import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { SelectField } from "../ui/SelectField";
import { FileUploadBox } from "./FileUploadBox";
import type { SupplierInfoValues, SupplierRegisterFiles } from "../../types";

const bankOptions = [
  { label: "은행 1", value: "bank1" },
  { label: "은행 2", value: "bank2" }
];

type SupplierInfoFormProps = {
  errors: Partial<Record<keyof SupplierInfoValues | keyof SupplierRegisterFiles, string>>;
  files: SupplierRegisterFiles;
  onBack?: () => void;
  onChange: (name: keyof SupplierInfoValues, value: string) => void;
  onFileChange: (name: keyof SupplierRegisterFiles, file: File | null) => void;
  onNext?: () => void;
  values: SupplierInfoValues;
};

export function SupplierInfoForm({ errors, files, onBack, onChange, onFileChange, onNext, values }: SupplierInfoFormProps) {
  return (
    <div className="mt-4">
      <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <FormField error={errors.companyName} label="업체명" name="companyName" onChange={(event) => onChange("companyName", event.target.value)} requiredMark type="text" value={values.companyName} />
        <FormField
          error={errors.businessRegistrationNumber}
          label="사업자등록번호"
          name="businessRegistrationNumber"
          onChange={(event) => onChange("businessRegistrationNumber", event.target.value)}
          requiredMark
          type="text"
          value={values.businessRegistrationNumber}
        />
        <FormField
          error={errors.headOfficePhone}
          label="본사전화번호"
          name="headOfficePhone"
          onChange={(event) => onChange("headOfficePhone", event.target.value)}
          requiredMark
          type="tel"
          value={values.headOfficePhone}
        />
        <SelectField error={errors.bankName} label="거래은행" name="bankName" onChange={(value) => onChange("bankName", value)} options={bankOptions} requiredMark value={values.bankName} />
        <FormField error={errors.accountHolder} label="예금주" name="accountHolder" onChange={(event) => onChange("accountHolder", event.target.value)} requiredMark type="text" value={values.accountHolder} />
        <FormField error={errors.accountNumber} label="계좌번호" name="accountNumber" onChange={(event) => onChange("accountNumber", event.target.value)} requiredMark type="text" value={values.accountNumber} />
        <FormField error={errors.password} label="비밀번호" name="password" onChange={(event) => onChange("password", event.target.value)} requiredMark type="password" value={values.password} />
        <FormField
          error={errors.passwordConfirm}
          label="비밀번호 확인"
          name="passwordConfirm"
          onChange={(event) => onChange("passwordConfirm", event.target.value)}
          requiredMark
          type="password"
          value={values.passwordConfirm}
        />
      </div>

      <section className="mb-12">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">첨부파일</h2>
          <p className="mt-1 text-sm text-gray-500">※ 사업자등록증, 통장사본 필수 제출</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FileUploadBox error={errors.businessRegistrationFile} label="사업자등록증" name="businessRegistrationFile" onChange={(file) => onFileChange("businessRegistrationFile", file)} value={files.businessRegistrationFile} />
          <FileUploadBox error={errors.bankbookFile} label="통장사본" name="bankbookFile" onChange={(file) => onFileChange("bankbookFile", file)} value={files.bankbookFile} />
        </div>
      </section>

      <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
        <Button type="button" className="text-lg" iconLeft={<ArrowLeftOutlined />} onClick={onBack}>
          이전
        </Button>
        <Button type="button" className="text-lg" iconRight={<ArrowRightOutlined />} onClick={onNext}>
          다음
        </Button>
      </div>
    </div>
  );
}
