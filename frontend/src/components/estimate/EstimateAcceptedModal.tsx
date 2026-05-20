import { useEffect, useState } from "react";
import {
  Button as AntButton,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type {
  EstimateRequest,
  EstimateResponse,
  EstimateResponseUpdatePayload,
  Supplier,
  SupplierOption,
} from "../../types";
import { listEstimateResponses, updateEstimateResponse } from "../../api";
import {
  formatShortDate,
  numberFormatter,
  numberParser,
  toNumericValue,
} from "../../utils";
import {
  EstimateRequestDescription,
  EstimateRequestVendorInfo,
} from "./EstimateRequestDescription";

type SupplierContactInfo = {
  companyName: string;
  contactName: string;
  email: string;
  mobilePhone: string;
};

type EditableEstimateResponse = {
  catalogNo: string;
  casNo: string;
  count: number;
  deliveryPeriod: string;
  deliveryStart: number | null;
  deliveryEnd: number | null;
  deliveryUnit: "day" | "week" | "month";
  grade: string;
  note: string;
  productName: string;
  purity: string;
  quoteFile: File | null;
  supplierId: number | null;
  unitCost: number;
  unitId: number | null;
  unitLabel: string;
  unitValue: number;
};

export function EstimateAcceptedModalContent({
  onClose,
  onSubmitted,
  request,
  supplier,
  supplierOptions,
  token,
}: {
  onClose: () => void;
  onSubmitted: (requestId: number) => void;
  request: EstimateRequest;
  supplier: Supplier;
  supplierOptions: SupplierOption[];
  token: string;
}) {
  const [estimateResponses, setEstimateResponses] = useState<
    EstimateResponse[]
  >([]);
  const [editingResponseId, setEditingResponseId] = useState<number | null>(
    null,
  );
  const [drafts, setDrafts] = useState<
    Record<number, EditableEstimateResponse>
  >({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [supplierContactInfo, setSupplierContactInfo] =
    useState<SupplierContactInfo>({
      companyName: supplier.companyName,
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      mobilePhone: supplier.mobilePhone || "",
    });

  useEffect(() => {
    let ignore = false;
    setError("");
    setLoading(true);

    listEstimateResponses(token, request.id)
      .then((data) => {
        if (ignore) {
          return;
        }
        setEstimateResponses(data.estimateResponses);
        setDrafts(
          Object.fromEntries(
            data.estimateResponses.map((response) => [
              response.id,
              toDraft(response),
            ]),
          ),
        );
      })
      .catch((nextError) => {
        if (!ignore) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "견적 목록을 불러오지 못했습니다.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [request.id, token]);

  async function saveResponse(response: EstimateResponse) {
    const draft = drafts[response.id];
    if (!draft) {
      setEditingResponseId(null);
      return;
    }

    setError("");
    setSavingId(response.id);

    try {
      const totalCost =
        toNumericValue(draft.unitCost) *
        Math.max(1, Math.trunc(toNumericValue(draft.count)));
      const payload: EstimateResponseUpdatePayload = {
        catalogNo: draft.catalogNo,
        casNo: draft.casNo,
        count: Math.max(1, Math.trunc(toNumericValue(draft.count))),
        deliveryPeriod: formatDeliveryPeriodFromDraft(draft),
        grade: draft.grade,
        note: draft.note,
        productName: draft.productName,
        purity: draft.purity,
        quoteFile: draft.quoteFile,
        supplierId: draft.supplierId,
        totalCost,
        unitCost: toNumericValue(draft.unitCost),
        unit: draft.unitId,
        unitValue: toNumericValue(draft.unitValue),
      };
      const result = await updateEstimateResponse(token, response.id, payload);
      setEstimateResponses((current) =>
        current.map((item) =>
          item.id === response.id ? result.estimateResponse : item,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [response.id]: toDraft(result.estimateResponse),
      }));
      setEditingResponseId(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "견적 수정에 실패했습니다.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="pb-1 pt-2">
      <Space className="w-full" direction="vertical" size={20}>
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={9}>
            <div className="flex h-full min-h-[680px] flex-col gap-5">
              <div className="min-h-[420px] flex-1">
                <EstimateRequestDescription
                  estimateRequest={request}
                  supplier={supplier}
                />
              </div>
              <EstimateRequestVendorInfo
                contactInfo={supplierContactInfo}
                onContactInfoChange={setSupplierContactInfo}
              />
            </div>
          </Col>
          <Col xs={24} lg={15}>
            {loading ? (
              <div className="flex h-full min-h-[680px] items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div className="eps-accepted-card-scroll flex h-full min-h-[680px] gap-4 overflow-x-auto pb-2">
                {estimateResponses.length > 0 ? (
                  estimateResponses.map((response, index) => (
                    <EstimateResponseCard
                      draft={drafts[response.id] ?? toDraft(response)}
                      editing={editingResponseId === response.id}
                      key={response.id}
                      requestUnitId={request.unitId}
                      requestUnitLabel={
                        request.unit == null ? "" : String(request.unit)
                      }
                      response={response}
                      saving={savingId === response.id}
                      supplierOptions={supplierOptions}
                      title={`견적서 ${index + 1}`}
                      onChange={(field, value) => {
                        setDrafts((current) => ({
                          ...current,
                          [response.id]: {
                            ...(current[response.id] ?? toDraft(response)),
                            [field]: value,
                          },
                        }));
                      }}
                      onEdit={() => setEditingResponseId(response.id)}
                      onSave={() => saveResponse(response)}
                    />
                  ))
                ) : (
                  <div className="flex min-h-[680px] min-w-[360px] items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    접수된 견적이 없습니다.
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
        <div className="flex justify-end gap-3 pt-1">
          {error ? (
            <p className="mr-auto self-center text-sm text-red-600">{error}</p>
          ) : null}
          <AntButton className="!h-10 !px-6" size="large">
            견적추가
          </AntButton>
          <AntButton
            className="!h-10 !bg-voronoi-orange !px-6 !font-bold"
            size="large"
            type="primary"
            onClick={onClose}
          >
            닫기
          </AntButton>
        </div>
      </Space>
    </div>
  );
}

function EstimateResponseCard({
  draft,
  editing,
  onChange,
  onEdit,
  onSave,
  response,
  requestUnitId,
  requestUnitLabel,
  saving,
  supplierOptions,
  title,
}: {
  draft: EditableEstimateResponse;
  editing: boolean;
  onChange: (
    field: keyof EditableEstimateResponse,
    value: string | number | File | null,
  ) => void;
  onEdit: () => void;
  onSave: () => void;
  response: EstimateResponse;
  requestUnitId: number | null;
  requestUnitLabel: string;
  saving: boolean;
  supplierOptions: SupplierOption[];
  title: string;
}) {
  const displayTotal = (
    editing
      ? toNumericValue(draft.unitCost) *
        Math.max(1, toNumericValue(draft.count))
      : response.totalCost
  ).toLocaleString();

  return (
    <Card
      className="h-full min-h-[520px] min-w-[340px] bg-gray-100"
      extra={
        <AntButton
          className="!bg-voronoi-orange !text-white"
          htmlType="button"
          loading={saving}
          shape="round"
          type="primary"
          onClick={editing ? onSave : onEdit}
        >
          {editing ? "완료" : "수정"}
        </AntButton>
      }
      title={<span className="text-2xl font-medium text-black">{title}</span>}
    >
      <div className="space-y-4 text-base">
        <ResponseRow
          label="접수일자"
          value={formatShortDate(response.dateCreated)}
        />
        <ResponseRow
          editing={editing}
          label="상품명"
          value={draft.productName}
          onChange={(value) => onChange("productName", value)}
        />
        <ResponseRow
          editing={editing}
          label="CAS No."
          value={draft.casNo}
          onChange={(value) => onChange("casNo", value)}
        />
        <ResponseSupplierRow
          editing={editing}
          response={response}
          supplierOptions={supplierOptions}
          value={draft.supplierId}
          onChange={(value) => onChange("supplierId", value)}
        />
        <ResponseRow
          editing={editing}
          label="Catalog No."
          value={draft.catalogNo}
          onChange={(value) => onChange("catalogNo", value)}
        />
        <ResponseRow
          editing={editing}
          label="Purity"
          value={draft.purity}
          onChange={(value) => onChange("purity", value)}
        />
        <ResponseRow
          editing={editing}
          label="Grade"
          value={draft.grade}
          onChange={(value) => onChange("grade", value)}
        />
        <ResponseRow
          editing={editing}
          label="비고"
          value={draft.note}
          onChange={(value) => onChange("note", value)}
        />
        <ResponseDeliveryPeriodRow
          deliveryEnd={draft.deliveryEnd}
          deliveryStart={draft.deliveryStart}
          deliveryUnit={draft.deliveryUnit}
          editing={editing}
          value={draft.deliveryPeriod}
          onChange={(field, value) => onChange(field, value)}
        />
        <ResponseUnitRow
          editing={editing}
          requestUnitId={requestUnitId}
          requestUnitLabel={requestUnitLabel}
          response={response}
          unitId={draft.unitId}
          unitValue={draft.unitValue}
          onUnitIdChange={(value) => onChange("unitId", value)}
          onUnitValueChange={(value) => onChange("unitValue", value)}
        />
        <ResponseFileRow
          documentPath={response.documentPath}
          editing={editing}
          quoteFile={draft.quoteFile}
          onChange={(value) => onChange("quoteFile", value)}
        />
        <ResponseRow
          editing={editing}
          label="단가"
          type="number"
          value={draft.unitCost}
          suffix="원"
          onChange={(value) => onChange("unitCost", value)}
        />
        <ResponseRow
          editing={editing}
          label="수량"
          type="number"
          value={draft.count}
          onChange={(value) => onChange("count", value)}
        />
        <ResponseRow label="총금액" value={`${displayTotal}원`} />
      </div>
    </Card>
  );
}

function ResponseRow({
  editing = false,
  label,
  onChange,
  suffix = "",
  type = "text",
  value,
}: {
  editing?: boolean;
  label: string;
  onChange?: (value: string | number | null) => void;
  suffix?: string;
  type?: "number" | "text";
  value: number | string;
}) {
  return (
    <label className="grid grid-cols-[105px_1fr] items-center gap-3">
      <span className="text-gray-500">{label}</span>
      {editing && onChange ? (
        type === "number" ? (
          <Space.Compact className="w-full">
            <InputNumber
              className="w-full"
              formatter={numberFormatter}
              parser={numberParser}
              min={0}
              value={Number(value || 0)}
              onChange={(nextValue) => onChange(nextValue)}
            />
            {suffix ? (
              <Input
                className="eps-static-addon w-14 cursor-default bg-gray-50 text-center text-gray-900"
                readOnly
                value={suffix}
              />
            ) : null}
          </Space.Compact>
        ) : (
          <Input
            className="!bg-white"
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
          />
        )
      ) : (
        <span className="text-gray-900">
          {formatDisplayValue(value)}
          {suffix}
        </span>
      )}
    </label>
  );
}

function ResponseSupplierRow({
  editing,
  onChange,
  response,
  supplierOptions,
  value,
}: {
  editing: boolean;
  onChange: (value: number | null) => void;
  response: EstimateResponse;
  supplierOptions: SupplierOption[];
  value: number | null;
}) {
  const supplierName =
    response.supplierName ||
    supplierOptions.find((item) => item.id === value)?.supplierName ||
    (value ? `Supplier #${value}` : "-");
  const selectOptions = createSupplierSelectOptions(supplierOptions, response);

  return (
    <label className="grid grid-cols-[105px_1fr] items-center gap-3">
      <span className="text-gray-500">Supplier</span>
      {editing ? (
        <Select
          className="w-full"
          options={selectOptions}
          placeholder="Supplier 선택"
          value={value ?? undefined}
          onChange={(nextValue) => onChange(nextValue ?? null)}
        />
      ) : (
        <span className="text-gray-900">{supplierName}</span>
      )}
    </label>
  );
}

function ResponseDeliveryPeriodRow({
  deliveryEnd,
  deliveryStart,
  deliveryUnit,
  editing,
  onChange,
  value,
}: {
  deliveryEnd: number | null;
  deliveryStart: number | null;
  deliveryUnit: "day" | "week" | "month";
  editing: boolean;
  onChange: (
    field: "deliveryStart" | "deliveryEnd" | "deliveryUnit",
    value: number | string | null,
  ) => void;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[105px_1fr] items-center gap-3">
      <span className="text-gray-500">배송기한</span>
      {editing ? (
        <div className="flex w-full items-center gap-2">
          <InputNumber
            className="w-full"
            max={31}
            min={0}
            value={deliveryStart ?? undefined}
            onChange={(nextValue) => onChange("deliveryStart", nextValue)}
          />
          <span className="text-gray-400">~</span>
          <InputNumber
            className="w-full"
            max={31}
            min={0}
            value={deliveryEnd ?? undefined}
            onChange={(nextValue) => onChange("deliveryEnd", nextValue)}
          />
          <Select
            className="w-20"
            options={[
              { label: "일", value: "day" },
              { label: "주", value: "week" },
              { label: "개월", value: "month" },
            ]}
            value={deliveryUnit}
            onChange={(nextValue) => onChange("deliveryUnit", nextValue)}
          />
        </div>
      ) : (
        <span className="text-gray-900">{formatDisplayValue(value)}</span>
      )}
    </div>
  );
}

function ResponseUnitRow({
  editing,
  onUnitIdChange,
  onUnitValueChange,
  requestUnitId,
  requestUnitLabel,
  response,
  unitId,
  unitValue,
}: {
  editing: boolean;
  onUnitIdChange: (value: number | null) => void;
  onUnitValueChange: (value: number | null) => void;
  requestUnitId: number | null;
  requestUnitLabel: string;
  response: EstimateResponse;
  unitId: number | null;
  unitValue: number;
}) {
  const unitOptions = createUnitOptions(response, requestUnitId, requestUnitLabel);
  const displayUnit =
    unitOptions.find((option) => option.value === unitId)?.label ||
    response.unit ||
    "-";

  return (
    <div className="grid grid-cols-[105px_1fr] items-center gap-3">
      <span className="text-gray-500">단위</span>
      {editing ? (
        <Space.Compact className="w-full">
          <InputNumber
            className="w-full"
            min={0}
            value={toNumericValue(unitValue)}
            onChange={(nextValue) => onUnitValueChange(nextValue)}
          />
          <Select
            className="!w-24"
            options={unitOptions}
            value={unitId ?? undefined}
            onChange={(nextValue) => onUnitIdChange(nextValue ?? null)}
          />
        </Space.Compact>
      ) : (
        <span className="text-gray-900">
          {formatDisplayValue(unitValue)} {displayUnit}
        </span>
      )}
    </div>
  );
}

function ResponseFileRow({
  documentPath,
  editing,
  onChange,
  quoteFile,
}: {
  documentPath: string;
  editing: boolean;
  onChange: (value: File | null) => void;
  quoteFile: File | null;
}) {
  const fileList: UploadFile[] = quoteFile
    ? [
        {
          name: quoteFile.name,
          status: "done",
          uid: `quote-file-${quoteFile.name}-${quoteFile.lastModified}`,
        },
      ]
    : [];

  return (
    <label className="grid grid-cols-[105px_1fr] items-center gap-3">
      <span className="text-gray-500">견적서 파일</span>
      {editing ? (
        <Upload
          accept=".pdf,.jpg,.jpeg,.png"
          beforeUpload={(file) => {
            onChange(file);
            return false;
          }}
          fileList={fileList}
          maxCount={1}
          onRemove={() => onChange(null)}
        >
          <AntButton htmlType="button" size="small">
            파일 선택
          </AntButton>
        </Upload>
      ) : (
        <span className="truncate text-gray-900">
          {quoteFile?.name || extractFilename(documentPath) || "-"}
        </span>
      )}
    </label>
  );
}

function createSupplierSelectOptions(
  supplierOptions: SupplierOption[],
  response: EstimateResponse,
) {
  const options = supplierOptions.map((item) => ({
    label: item.supplierName,
    value: item.id,
  }));

  if (
    response.supplierId &&
    response.supplierName &&
    !options.some((item) => item.value === response.supplierId)
  ) {
    return [
      { label: response.supplierName, value: response.supplierId },
      ...options,
    ];
  }

  return options;
}

function createUnitOptions(
  response: EstimateResponse,
  requestUnitId: number | null,
  requestUnitLabel: string,
) {
  const options: Array<{ label: string; value: number | null }> = [];

  const responseUnitLabel = response.unit == null ? "" : String(response.unit).trim();
  if (responseUnitLabel) {
    options.push({ label: responseUnitLabel, value: response.unitId });
  }

  const requestUnitTrimmed = requestUnitLabel.trim();
  if (
    requestUnitTrimmed &&
    !options.some((option) => option.value === requestUnitId && option.label === requestUnitTrimmed)
  ) {
    options.push({ label: requestUnitTrimmed, value: requestUnitId });
  }

  return options;
}

function toDraft(response: EstimateResponse): EditableEstimateResponse {
  const parsedDelivery = parseDeliveryPeriod(response.deliveryPeriod || "");

  return {
    catalogNo: response.catalogNo || "",
    casNo: response.casNo || "",
    count: response.count || 1,
    deliveryPeriod: response.deliveryPeriod || "",
    deliveryStart: parsedDelivery.deliveryStart,
    deliveryEnd: parsedDelivery.deliveryEnd,
    deliveryUnit: parsedDelivery.deliveryUnit,
    grade: response.grade || "",
    note: response.note || "",
    productName: response.productName || "",
    purity: response.purity || "",
    quoteFile: null,
    supplierId: response.supplierId,
    unitCost: response.unitCost || 0,
    unitId: response.unitId,
    unitLabel: response.unit == null ? "" : String(response.unit),
    unitValue: response.unitValue || 0,
  };
}

function formatDisplayValue(value: number | string) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return value || "-";
}

function parseDeliveryPeriod(value: string) {
  const trimmed = value.trim();
  const matched = trimmed.match(/^(\d+)\s*~\s*(\d+)\s*(일|주|개월)$/);
  if (!matched) {
    return {
      deliveryEnd: null,
      deliveryStart: null,
      deliveryUnit: "week" as const,
    };
  }

  const [, start, end, unitLabel] = matched;
  return {
    deliveryEnd: Number(end),
    deliveryStart: Number(start),
    deliveryUnit:
      unitLabel === "일" ? ("day" as const) : unitLabel === "개월" ? ("month" as const) : ("week" as const),
  };
}

function formatDeliveryPeriodFromDraft(draft: EditableEstimateResponse) {
  const start = draft.deliveryStart;
  const end = draft.deliveryEnd;
  if (start == null && end == null) {
    return draft.deliveryPeriod;
  }

  const unitLabel =
    draft.deliveryUnit === "day"
      ? "일"
      : draft.deliveryUnit === "month"
        ? "개월"
        : "주";
  return `${start ?? ""}~${end ?? ""}${unitLabel}`;
}

function extractFilename(path: string | null | undefined) {
  if (!path) {
    return "";
  }
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || "";
}
