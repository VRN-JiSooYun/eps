import { useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supplierRegister } from "../../api";
import { ContactInfoForm } from "../../components/register/ContactInfoForm";
import { SupplierInfoForm } from "../../components/register/SupplierInfoForm";
import { TermsAgreementBox } from "../../components/register/TermsAgreementBox";
import { Button } from "../../components/ui/Button";
import { RegisterLayout } from "../../layout/RegisterLayout";
import type { ContactInfoValues, SupplierInfoValues, SupplierRegisterFiles } from "../../types";

const tokenKey = "eps.auth.token";
const supplierKey = "eps.auth.supplier";

const initialSupplierForm: SupplierInfoValues = {
  companyName: "",
  businessRegistrationNumber: "",
  headOfficePhone: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  password: "",
  passwordConfirm: ""
};

const initialContactForm: ContactInfoValues = {
  contactName: "",
  position: "",
  department: "",
  mobilePhone: "",
  directPhone: "",
  email: "",
  emailNotificationEnabled: false
};

const initialFiles: SupplierRegisterFiles = {
  businessRegistrationFile: null,
  bankbookFile: null
};

const maxFileSize = 10 * 1024 * 1024;
const allowedFileExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

type SupplierErrors = Partial<Record<keyof SupplierInfoValues | keyof SupplierRegisterFiles, string>>;
type ContactErrors = Partial<Record<keyof ContactInfoValues | "submit", string>>;

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierInfoValues>(initialSupplierForm);
  const [contactForm, setContactForm] = useState<ContactInfoValues>(initialContactForm);
  const [files, setFiles] = useState<SupplierRegisterFiles>(initialFiles);
  const [supplierErrors, setSupplierErrors] = useState<SupplierErrors>({});
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateSupplierField(name: keyof SupplierInfoValues, value: string) {
    setSupplierForm((current) => ({ ...current, [name]: value }));
    setSupplierErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateContactField(name: keyof ContactInfoValues, value: string | boolean) {
    setContactForm((current) => ({ ...current, [name]: value }));
    setContactErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  }

  function updateFile(name: keyof SupplierRegisterFiles, file: File | null) {
    setFiles((current) => ({ ...current, [name]: file }));
    setSupplierErrors((current) => ({ ...current, [name]: undefined }));
  }

  function agreeAndGoNext() {
    setPrivacyAgreed(true);
    setStep(2);
  }

  function validateSupplierStep() {
    const nextErrors: SupplierErrors = {};
    const requiredFields: Array<keyof SupplierInfoValues> = [
      "companyName",
      "businessRegistrationNumber",
      "headOfficePhone",
      "bankName",
      "accountHolder",
      "accountNumber",
      "password",
      "passwordConfirm"
    ];

    requiredFields.forEach((field) => {
      if (!supplierForm[field].trim()) {
        nextErrors[field] = "필수 입력 항목입니다.";
      }
    });

    if (supplierForm.password && supplierForm.password.length < 8) {
      nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }
    if (supplierForm.passwordConfirm && supplierForm.password !== supplierForm.passwordConfirm) {
      nextErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    const businessRegistrationFileError = validateUpload(files.businessRegistrationFile, "사업자등록증");
    if (businessRegistrationFileError) {
      nextErrors.businessRegistrationFile = businessRegistrationFileError;
    }
    const bankbookFileError = validateUpload(files.bankbookFile, "통장사본");
    if (bankbookFileError) {
      nextErrors.bankbookFile = bankbookFileError;
    }

    setSupplierErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateContactStep() {
    const nextErrors: ContactErrors = {};
    const requiredFields: Array<keyof ContactInfoValues> = ["contactName", "position", "department", "mobilePhone", "email"];

    requiredFields.forEach((field) => {
      const value = contactForm[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = "필수 입력 항목입니다.";
      }
    });

    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      nextErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    setContactErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToContactStep() {
    if (validateSupplierStep()) {
      setStep(3);
    }
  }

  function goToLoginPage() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(supplierKey);
    navigate("/");
  }

  async function submitRegistration() {
    if (!validateContactStep()) {
      return;
    }

    setSubmitting(true);
    setContactErrors((current) => ({ ...current, submit: undefined }));

    try {
      const response = await supplierRegister({
        supplier: supplierForm,
        contact: contactForm,
        files,
        privacyAgreed
      });
      localStorage.setItem(tokenKey, response.token);
      localStorage.setItem(supplierKey, JSON.stringify(response.supplier));
      setStep(4);
    } catch (error) {
      setContactErrors((current) => ({
        ...current,
        submit: error instanceof Error ? error.message : "공급업체 등록에 실패했습니다."
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RegisterLayout currentStep={step}>
      {step === 1 ? (
        <div className="flex h-[600px] w-full flex-col rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <TermsAgreementBox />

          <div className="mt-8 flex justify-end">
            <Button className="text-lg" type="button" iconRight={<ArrowRightOutlined />} onClick={agreeAndGoNext}>
              동의
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="w-full rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <SupplierInfoForm
            errors={supplierErrors}
            files={files}
            onBack={() => setStep(1)}
            onChange={updateSupplierField}
            onFileChange={updateFile}
            onNext={goToContactStep}
            values={supplierForm}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="w-full rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <ContactInfoForm errors={contactErrors} onBack={() => setStep(2)} onChange={updateContactField} onNext={submitRegistration} submitting={submitting} values={contactForm} />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-voronoi-orange text-xl font-bold text-white">4</div>
          <h2 className="text-2xl font-bold text-gray-900">공급업체 등록완료</h2>
          <p className="mt-3 text-gray-600">공급업체 등록이 완료되었습니다.</p>
          <Button type="button" className="mt-8" onClick={goToLoginPage}>
            로그인 페이지로 이동
          </Button>
        </div>
      ) : null}
    </RegisterLayout>
  );
};

export default Register;

function validateUpload(file: File | null, label: string) {
  if (!file) {
    return `${label} 파일을 첨부해주세요.`;
  }
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!allowedFileExtensions.includes(extension)) {
    return "pdf, jpg, png 파일만 첨부할 수 있습니다.";
  }
  if (file.size > maxFileSize) {
    return "10MB 이하 파일만 첨부할 수 있습니다.";
  }
  return "";
}
