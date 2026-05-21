import type { EstimateRequest, Supplier, SupplierOption } from "../../types";
import { EstimateAcceptedModalContent } from "./EstimateAcceptedModal";

export function EstimateSelectingModalContent({
  onClose,
  request,
  supplier,
  supplierOptions,
  token,
}: {
  onClose: () => void;
  request: EstimateRequest;
  supplier: Supplier;
  supplierOptions: SupplierOption[];
  token: string;
}) {
  return (
    <EstimateAcceptedModalContent
      allowAddResponse={false}
      allowEditResponse={false}
      onClose={onClose}
      onSubmitted={() => undefined}
      request={request}
      supplier={supplier}
      supplierOptions={supplierOptions}
      token={token}
    />
  );
}
