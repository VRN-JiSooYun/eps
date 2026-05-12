import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ContactInfoForm } from "../../components/register/ContactInfoForm";
import { SupplierInfoForm } from "../../components/register/SupplierInfoForm";
import { TermsAgreementBox } from "../../components/register/TermsAgreementBox";
import { Button } from "../../components/ui/Button";
import { RegisterLayout } from "../../layout/RegisterLayout";

const Register = () => {
  const [step, setStep] = useState(1);

  return (
    <RegisterLayout currentStep={step}>
      {step === 1 ? (
        <div className="flex h-[600px] w-full flex-col rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <TermsAgreementBox />

          <div className="mt-8 flex justify-end">
            <Button type="button" iconRight={<ArrowRight size={24} strokeWidth={2} />} onClick={() => setStep(2)}>
              동의
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="w-full rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <SupplierInfoForm onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="w-full rounded-lg border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <ContactInfoForm onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      ) : null}
    </RegisterLayout>
  );
};

export default Register;
