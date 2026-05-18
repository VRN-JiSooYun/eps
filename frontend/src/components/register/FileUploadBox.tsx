import { CloseOutlined, FilePdfOutlined, InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";

type FileUploadBoxProps = {
  accept?: string;
  error?: string;
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  value: File | null;
};

export function FileUploadBox({ accept = ".pdf,.jpg,.jpeg,.png", error, label, name, onChange, value }: FileUploadBoxProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const isImageFile = value?.type.startsWith("image/");

  useEffect(() => {
    if (!value || !isImageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [isImageFile, value]);

  const fileList: UploadFile[] = value
    ? [
        {
          name: value.name,
          status: "done",
          uid: `${name}-${value.name}-${value.lastModified}`
        }
      ]
    : [];

  return (
    <div>
      <Upload.Dragger
        accept={accept}
        beforeUpload={(file) => {
          onChange(file);
          return false;
        }}
        className={error ? "eps-upload-error" : ""}
        fileList={fileList}
        maxCount={1}
        name={name}
        onRemove={() => {
          onChange(null);
        }}
        showUploadList={false}
      >
        {value ? (
          <div className="relative flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-5">
            <button
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:text-voronoi-orange"
              type="button"
              aria-label={`${label} 파일 삭제`}
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
            >
              <CloseOutlined />
            </button>
            {previewUrl ? (
              <img className="h-28 max-w-full rounded border border-gray-200 object-contain" src={previewUrl} alt={`${label} 미리보기`} />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded border border-gray-200 bg-gray-50 text-4xl text-voronoi-orange">
                <FilePdfOutlined />
              </div>
            )}
            <div className="max-w-full text-center">
              <p className="truncate text-sm font-medium text-gray-900">{value.name}</p>
              <p className="mt-1 text-xs text-gray-500">{formatFileSize(value.size)}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{label}</p>
            <p className="ant-upload-hint">pdf, jpg, png 첨부 가능</p>
          </>
        )}
      </Upload.Dragger>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))}KB`;
}
