import { ChangeEvent, useId } from "react";
import { Paperclip } from "lucide-react";

type FileUploadBoxProps = {
  accept?: string;
  error?: string;
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  value: File | null;
};

export function FileUploadBox({ accept = ".pdf,.jpg,.jpeg,.png", error, label, name, onChange, value }: FileUploadBoxProps) {
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
  }

  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 p-10 text-center ${error ? "border-red-400" : "border-gray-200"}`}>
      <Paperclip className="mb-4 -rotate-45 text-gray-700" size={40} strokeWidth={1.8} />
      <p className="mb-1 font-medium text-gray-900">{label}</p>
      <p className="mb-6 text-sm text-gray-500">pdf, jpg, png 첨부 가능</p>
      {value ? <p className="mb-4 max-w-full truncate text-sm font-medium text-voronoi-orange">{value.name}</p> : null}
      <input accept={accept} className="sr-only" id={inputId} name={name} onChange={handleChange} type="file" />
      <label className="cursor-pointer rounded bg-[#555555] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#444444]" htmlFor={inputId}>
        파일 가져오기
      </label>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
