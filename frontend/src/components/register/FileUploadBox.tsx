import { Paperclip } from "lucide-react";

type FileUploadBoxProps = {
  label: string;
};

export function FileUploadBox({ label }: FileUploadBoxProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
      <Paperclip className="mb-4 -rotate-45 text-gray-700" size={40} strokeWidth={1.8} />
      <p className="mb-1 font-medium text-gray-900">{label}</p>
      <p className="mb-6 text-sm text-gray-500">pdf, jpg, png 첨부 가능</p>
      <button className="rounded bg-[#555555] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#444444]" type="button">
        파일 가져오기
      </button>
    </div>
  );
}
