import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { RegisterStepper } from "../components/register/RegisterStepper";

type RegisterLayoutProps = {
  children: ReactNode;
  currentStep: number;
};

export function RegisterLayout({ children, currentStep }: RegisterLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-gray-900">
      <header className="flex items-center border-b border-gray-200 bg-white px-6 py-5 md:px-8 md:py-6">
        <h1 className="text-2xl font-bold">공급업체등록</h1>
        <Link className="ml-auto text-sm text-gray-500 transition hover:text-gray-700" to="/">
          로그인
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-grow flex-col px-4 py-8 sm:px-6 lg:px-8">
        <RegisterStepper currentStep={currentStep} />
        {children}
      </section>
    </main>
  );
}
