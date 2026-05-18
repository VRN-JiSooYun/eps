import { InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadFile } from "antd";

type FileUploadBoxProps = {
  accept?: string;
  error?: string;
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  value: File | null;
};

export function FileUploadBox({ accept = ".pdf,.jpg,.jpeg,.png", error, label, name, onChange, value }: FileUploadBoxProps) {
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
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{label}</p>
        <p className="ant-upload-hint">pdf, jpg, png 첨부 가능</p>
      </Upload.Dragger>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
