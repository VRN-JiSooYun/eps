import { CloseOutlined } from "@ant-design/icons";
import { Button as AntButton, Checkbox, Modal as AntdModal } from "antd";
import { useState } from "react";

const deliveryAbandonOptions = [
  "급격한 환율 변동으로 인해 가격이 인상됐어요",
  "제조사 가격 인상으로 가격이 인상됐어요",
  "재고 소진 및 납기 일정 미정으로 납품이 불가해요",
  "제품이 단종되어 납품이 불가해요",
];

export function DeliveryAbandonModal({
  onClose,
  onSubmit,
  open,
}: {
  onClose: () => void;
  onSubmit: (reasons: string[]) => void;
  open: boolean;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  function closeModal() {
    setSelectedReasons([]);
    onClose();
  }

  return (
    <AntdModal
      centered
      className="eps-request-modal"
      closable={false}
      footer={
        <div className="p-6">
          <AntButton
            className="!h-10 !bg-voronoi-orange !px-6 !font-bold"
            disabled={selectedReasons.length === 0}
            size="large"
            type="primary"
            onClick={() => {
              onSubmit(selectedReasons);
              setSelectedReasons([]);
            }}
          >
            전송
          </AntButton>
        </div>
      }
      open={open}
      styles={{
        body: { minHeight: 240, padding: "24px" },
        header: {
          background: "#E75A22",
          borderRadius: "10px 10px 0 0",
          margin: 0,
          padding: "14px 18px",
        },
      }}
      title={
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">납품포기</span>
          <button
            aria-label="납품포기 모달 닫기"
            className="flex h-6 w-6 items-center justify-center text-white transition hover:text-white/80"
            type="button"
            onClick={closeModal}
          >
            <CloseOutlined className="text-lg" />
          </button>
        </div>
      }
      width={700}
      onCancel={closeModal}
    >
      <div className="flex min-h-[180px] flex-col">
        <Checkbox.Group
          className="flex flex-col gap-4"
          value={selectedReasons}
          onChange={(values) => setSelectedReasons(values.map(String))}
        >
          {deliveryAbandonOptions.map((option) => (
            <Checkbox
              className="eps-request-option text-lg text-gray-700"
              key={option}
              value={option}
            >
              {option}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>
    </AntdModal>
  );
}
