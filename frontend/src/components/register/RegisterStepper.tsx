type Step = {
  id: number;
  label: string;
};

const steps: Step[] = [
  { id: 1, label: "개인정보 수집·이용 동의" },
  { id: 2, label: "공급업체정보 입력" },
  { id: 3, label: "담당자정보 입력" },
  { id: 4, label: "공급업체 등록완료" }
];

type RegisterStepperProps = {
  currentStep?: number;
};

export function RegisterStepper({ currentStep = 1 }: RegisterStepperProps) {
  return (
    <nav className="mb-8 grid w-full overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm md:grid-cols-4" aria-label="공급업체 등록 단계">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        return (
          <div
            className={`relative flex min-w-max items-center justify-center px-4 py-4 ${isActive ? "bg-voronoi-orange/10" : "bg-white"}`}
            key={step.id}
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  isActive ? "bg-voronoi-orange text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.id}
              </span>
              <span className={`truncate text-base md:text-lg ${isActive ? "font-medium text-voronoi-orange" : "text-gray-500"}`}>{step.label}</span>
            </div>
            {isActive ? <span className="absolute bottom-0 left-0 right-0 h-1 bg-voronoi-orange" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
