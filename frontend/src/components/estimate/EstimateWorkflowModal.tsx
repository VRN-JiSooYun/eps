import type { ReactNode } from "react";
import { Modal } from "../../layout/Modal/Modal";

const ESTIMATE_WORKFLOW_MODAL_WIDTH = 1280;
const ESTIMATE_WORKFLOW_MODAL_MIN_HEIGHT_CLASS = "min-h-[760px]";

export function EstimateWorkflowModal({
  content,
  onClose,
  requestNumber,
  title,
  visible,
}: {
  content: ReactNode;
  onClose: () => void;
  requestNumber: string;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal
      content={
        <div className={ESTIMATE_WORKFLOW_MODAL_MIN_HEIGHT_CLASS}>
          {content}
        </div>
      }
      onClose={onClose}
      title={
        <span className="text-2xl font-bold text-black">
          {title}
          <span className="ml-3 text-lg font-semibold text-gray-400">
            {requestNumber}
          </span>
        </span>
      }
      visible={visible}
      width={ESTIMATE_WORKFLOW_MODAL_WIDTH}
    />
  );
}
