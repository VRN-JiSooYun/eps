import { Steps } from "antd";

const steps = [
  { title: "개인정보 수집·이용 동의" },
  { title: "공급업체정보 입력" },
  { title: "담당자정보 입력" },
  { title: "공급업체 등록완료" }
];

type RegisterStepperProps = {
  currentStep?: number;
};

export function RegisterStepper({ currentStep = 1 }: RegisterStepperProps) {
  return (
    <nav className="mb-8 overflow-x-auto rounded-md border border-gray-200 bg-white px-5 py-4 shadow-sm" aria-label="공급업체 등록 단계">
      <Steps current={currentStep - 1} items={steps} responsive={false} />
    </nav>
  );
}
