import type {
  EstimateRequest,
  EstimateRequestSubStatus,
  EstimateResponse,
  EstimateResponseFormValues,
} from "./types";
import type { InputNumberProps } from "antd";

export const numberFormatter: InputNumberProps<number>["formatter"] = (
  value,
) => {
  if (value === undefined || value === null) {
    return "";
  }
  const [start, end] = `${value}`.split(".");
  const formattedStart = start.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return end ? `${formattedStart}.${end}` : formattedStart;
};

export const numberParser: InputNumberProps<number>["parser"] = (value) => {
  const numericValue = Number(`${value ?? ""}`.replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export function toNumericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const numericValue = Number(`${value ?? ""}`.replace(/,/g, "").trim());
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function formatDeliveryPeriod(values: EstimateResponseFormValues) {
  const start = values.deliveryStart ?? "";
  const end = values.deliveryEnd ?? "";
  const unitLabel =
    values.deliveryUnit === "day"
      ? "일"
      : values.deliveryUnit === "month"
        ? "개월"
        : "주";
  if (start === "" && end === "") {
    return "";
  }
  return `${start}~${end}${unitLabel}`;
}

export function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))}KB`;
}

export function isRequestStatus(request: EstimateRequest, statuses: string[]) {
  const status = (request.status ?? "").trim().toLowerCase();
  return statuses.map((item) => item.toLowerCase()).includes(status);
}

export function compareText(a: unknown, b: unknown) {
  return String(a ?? "").localeCompare(String(b ?? ""), "ko-KR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function compareDate(a: string | null, b: string | null) {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
}

export function formatEstimateRequestNumber(request: EstimateRequest) {
  if (request.purchaseRequest) {
    return request.purchaseRequest;
  }
  return `ER-${String(request.id).padStart(6, "0")}`;
}

export function formatSupplier(request: EstimateRequest | EstimateResponse) {
  return (
    request.supplierName ||
    (request.supplierId ? `Supplier #${request.supplierId}` : "-")
  );
}

export function formatEstimateRequestSubStatus(
  subStatus: EstimateRequestSubStatus | null | undefined,
) {
  switch (subStatus) {
    case "selecting.approval_pending":
      return "승인 대기";
    case "selecting.vendor_selecting":
      return "업체 선정중";
    case "delivered.payment_pending":
      return "결제 대기";
    case "delivered.completed":
      return "거래 완료";
    default:
      return "-";
  }
}

export function formatUnit(request: EstimateRequest) {
  const unit = request.unit == null ? "" : String(request.unit).trim();
  if (!unit) {
    return "-";
  }
  return `${request.unitValue} ${unit}`;
}

export function formatUnitLabel(request: EstimateRequest) {
  return request.unit == null ? "" : String(request.unit).trim();
}

export function formatShortDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
    .format(date)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}
