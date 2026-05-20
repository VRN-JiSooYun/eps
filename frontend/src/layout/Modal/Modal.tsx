// Modal Component
// Description: 모달 창을 나타내는 컴포넌트입니다. 배경을 어둡게 처리하여 모달에 집중할 수 있도록 합니다. 모달 내부에는 제목과 내용을 포함할 수 있습니다.
import { Modal as AntdModal } from "antd";
import React from "react";

interface ModalProps {
  visible: boolean;
  title: React.ReactNode;
  content: React.ReactNode;
  onClose: () => void;
  width?: number | string;
}

export const Modal: React.FC<ModalProps> = ({ visible, title, content, onClose, width }) => {
  return (
    <AntdModal
      open={visible}
      title={title}
      onCancel={onClose}
      footer={null}
      centered
      width={width}
      destroyOnClose
    >
      {content}
    </AntdModal>
  );
};
