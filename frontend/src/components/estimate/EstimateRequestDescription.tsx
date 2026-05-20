import type { EstimateRequest, Supplier } from "../../types";
import { Card, Descriptions, Button as AntButton, Input } from "antd";
import { formatDateTime, formatSupplier, formatUnit } from "../../utils";
import { useState } from "react";

type EstimateRequestDescriptionProps = {
  estimateRequest: EstimateRequest;
  supplier: Supplier;
};

export function EstimateRequestDescription({
  estimateRequest,
  supplier,
}: EstimateRequestDescriptionProps) {
  return (
    <Card
      className="h-full bg-gray-100"
      variant="outlined"
      title={
        <span className="text-2xl font-medium text-black">견적요청서</span>
      }
    >
      <Descriptions
        className="eps-info-descriptions"
        column={1}
        colon={false}
        items={[
          {
            label: "요청일시",
            children: formatDateTime(estimateRequest.dateCreated),
          },
          {
            label: "마감날짜",
            children: formatDateTime(estimateRequest.dateDiscard),
          },
          { label: "상품명", children: estimateRequest.productName },
          { label: "CAS No.", children: estimateRequest.casNo || "-" },
          { label: "Supplier", children: formatSupplier(estimateRequest) },
          {
            label: "Catalog No.",
            children: (
              <span className="text-voronoi-orange underline underline-offset-2">
                {estimateRequest.catalogNo || "-"}
              </span>
            ),
          },
          { label: "단위", children: formatUnit(estimateRequest) },
          { label: "수량", children: estimateRequest.count },
        ]}
      />
    </Card>
  );
}

type SupplierContactInfo = {
  companyName: string;
  contactName: string;
  email: string;
  mobilePhone: string;
};

type SupplierContactInfoKey = keyof SupplierContactInfo;

function SupplierContactRow({
  editing,
  label,
  onChange,
  type = "text",
  value,
}: {
  editing: boolean;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid grid-cols-[120px_1fr] items-center gap-3">
      <span className="text-gray-500">{label}</span>
      {editing ? (
        <Input
          className="!bg-white"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <span className="text-gray-900">{value || "-"}</span>
      )}
    </label>
  );
}

export function EstimateRequestVendorInfo({
  contactInfo: supplierContactInfo,
  onContactInfoChange,
}: {
  contactInfo: SupplierContactInfo;
  onContactInfoChange: (info: SupplierContactInfo) => void;
}) {
  const [isSupplierEditing, setIsSupplierEditing] = useState(false);

  function updateSupplierContactInfo(
    name: SupplierContactInfoKey,
    value: string,
  ) {
    onContactInfoChange({ ...supplierContactInfo, [name]: value });
  }

  const supplierContactRows: Array<{
    label: string;
    name: SupplierContactInfoKey;
    type?: string;
  }> = [
    { label: "업체", name: "companyName" },
    { label: "담당자", name: "contactName" },
    { label: "휴대폰", name: "mobilePhone" },
    { label: "이메일", name: "email", type: "email" },
  ];

  return (
    <Card
      className="min-h-[230px] w-full bg-gray-100"
      bordered={false}
      extra={
        <AntButton
          className="!bg-voronoi-orange !text-white"
          htmlType="button"
          shape="round"
          type="primary"
          onClick={() => setIsSupplierEditing((current) => !current)}
        >
          {isSupplierEditing ? "완료" : "수정"}
        </AntButton>
      }
      title={
        <span className="text-2xl font-medium text-black">담당업체정보</span>
      }
    >
      <div className="space-y-4 text-base">
        {supplierContactRows.map((row) => (
          <SupplierContactRow
            editing={isSupplierEditing}
            key={row.name}
            label={row.label}
            type={row.type}
            value={supplierContactInfo[row.name]}
            onChange={(value) => updateSupplierContactInfo(row.name, value)}
          />
        ))}
      </div>
    </Card>
  );
}

export function EstimateAcceptedDescription({
  estimateRequest,
  supplier,
}: EstimateRequestDescriptionProps) {
  return (
    <Card>
      <Descriptions
        className="eps-info-descriptions"
        column={1}
        colon={false}
        items={[
          {
            label: "요청일시",
            children: formatDateTime(estimateRequest.dateCreated),
          },
          {
            label: "마감날짜",
            children: formatDateTime(estimateRequest.dateDiscard),
          },
          { label: "상품명", children: estimateRequest.productName },
          { label: "CAS No.", children: estimateRequest.casNo || "-" },
          { label: "Supplier", children: formatSupplier(estimateRequest) },
          {
            label: "Catalog No.",
            children: (
              <span className="text-voronoi-orange underline underline-offset-2">
                {estimateRequest.catalogNo || "-"}
              </span>
            ),
          },
          { label: "단위", children: formatUnit(estimateRequest) },
          { label: "수량", children: estimateRequest.count },
        ]}
      />
    </Card>
  );
}
