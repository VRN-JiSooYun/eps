import { useEffect, useRef, useState } from "react";
import { BellOutlined, DownOutlined, LogoutOutlined, PaperClipOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button as AntButton, Card, Checkbox, Col, Descriptions, Form, Input, InputNumber, Row, Select, Space, Table, Upload } from "antd";
import type { TableColumnsType } from "antd";
import type { EstimateRequest, Supplier } from "../../types";
import { Modal } from "../../layout/Modal/Modal";

type MainPageProps = {
  loading: boolean;
  message: string;
  onLogout: () => void;
  estimateRequests: EstimateRequest[];
  supplier: Supplier;
};

type SectionConfig = {
  count: number;
  emptyText: string;
  rows: EstimateRequest[];
  title: string;
  type: "pending" | "completed" | "selecting";
};

const tabs = ["견적대기", "견적완료", "선정중", "납품요청", "배송중", "납품완료"];
const secondaryTabs = ["미선정", "주문취소"];
const STICKY_HEIGHT = 180;
const ROWS_PER_PAGE = 5;

export function MainPage({ estimateRequests, loading, message, onLogout, supplier }: MainPageProps) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingRows = estimateRequests.filter((request) => isRequestStatus(request, ["", "pending"]));
  const completedRows = estimateRequests.filter((request) => isRequestStatus(request, ["completed"]));
  const selectingRows = estimateRequests.filter((request) => isRequestStatus(request, ["selecting"]));
  const deliveryRequestedRows = estimateRequests.filter((request) => isRequestStatus(request, ["delivery_requested", "delivery-requested", "납품요청"]));
  const shippingRows = estimateRequests.filter((request) => isRequestStatus(request, ["shipping", "배송중"]));
  const deliveredRows = estimateRequests.filter((request) => isRequestStatus(request, ["delivered", "납품완료"]));
  const pendingCount = pendingRows.length;
  const displayName = supplier.contactName || supplier.companyName || supplier.email;
  const sections: SectionConfig[] = [
    {
      count: pendingCount,
      emptyText: "대기 중인 견적 요청이 없습니다.",
      rows: pendingRows,
      title: "견적대기",
      type: "pending"
    },
    {
      count: completedRows.length,
      emptyText: "완료된 견적이 없습니다.",
      rows: completedRows,
      title: "견적완료",
      type: "completed"
    },
    {
      count: selectingRows.length,
      emptyText: "선정 중인 견적이 없습니다.",
      rows: selectingRows,
      title: "선정중",
      type: "selecting"
    },
    {
      count: deliveryRequestedRows.length,
      emptyText: "납품요청 중인 견적이 없습니다.",
      rows: deliveryRequestedRows,
      title: "납품요청",
      type: "selecting"
    },
    {
      count: shippingRows.length,
      emptyText: "배송 중인 견적이 없습니다.",
      rows: shippingRows,
      title: "배송중",
      type: "selecting"
    },
    {
      count: deliveredRows.length,
      emptyText: "납품 완료된 견적이 없습니다.",
      rows: deliveredRows,
      title: "납품완료",
      type: "selecting"
    }
  ];

  function scrollToSection(title: string) {
    setSelectedTab(title);
    sectionRefs.current[title]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Sticky nav 아래의 기준선이 지난 마지막 섹션을 현재 탭으로 본다.
  useEffect(() => {
    let animationFrame = 0;

    const updateSelectedTab = () => {
      const scrollLine = window.scrollY + STICKY_HEIGHT + 16;
      const activeSection = sections.reduce<string>((currentActive, section) => {
        const element = sectionRefs.current[section.title];
        if (!element) {
          return currentActive;
        }
        return element.offsetTop <= scrollLine ? section.title : currentActive;
      }, sections[0].title);

      setSelectedTab((current) => (current === activeSection ? current : activeSection));
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateSelectedTab);
    };

    updateSelectedTab();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [loading, estimateRequests]);

  useEffect(() => {
    const lastSection = sections[sections.length - 1];
    const element = sectionRefs.current[lastSection.title];
    if (!element) {
      return;
    }

    const updateMargin = () => {
      const sectionHeight = element.offsetHeight;
      const viewportHeight = window.innerHeight;
      const neededMargin = viewportHeight - sectionHeight - STICKY_HEIGHT;
      element.style.marginBottom = `${Math.max(neededMargin, 32)}px`;
    };

    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, [estimateRequests]);

  return (
    <main className="flex min-h-screen flex-col bg-[#F3F4F6] font-sans text-gray-800">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#E75A22] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center text-2xl font-bold tracking-normal">
            <img className="h-8 mr-2 brightness-0 invert" src="/logos/1_vrn_logo_orange.png" alt="VORONOI Logo" />
            <span className="mx-3 font-light">X</span>
            <span>{supplier.companyName}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button className="relative transition-colors hover:text-gray-200" type="button" aria-label="알림" title="알림">
            <BellOutlined className="text-xl" />
            {pendingCount > 0 ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-white" /> : null}
          </button>
          <button className="flex items-center transition-colors hover:text-gray-200" type="button" onClick={onLogout} title="로그아웃">
            <span className="mr-2 font-medium">{displayName}님</span>
            <DownOutlined className="text-sm" />
            <LogoutOutlined className="ml-3 text-xl" />
          </button>
        </div>
      </header>

      <nav className="sticky top-[64px] z-40 border-b border-gray-200 bg-white px-6">
        <div className="flex items-end justify-between overflow-x-auto">
          <ul className="flex min-w-max space-x-8 pt-4 text-lg font-bold text-gray-500">
            {tabs.map((tab) => {
              const isSelected = selectedTab === tab;
              const section = sections.find((item) => item.title === tab);
              return (
                <li
                  onClick={() => scrollToSection(tab)}
                  className={`group flex cursor-pointer items-center border-b-4 pb-3 transition-colors ${
                    isSelected ? "border-[#E75A22] text-[#E75A22]" : "border-transparent hover:border-gray-300 hover:text-gray-700"
                  }`}
                  key={tab}
                >
                  {tab}
                  <CountBadge active={isSelected} count={section?.count ?? 0} className="ml-2 h-6 w-6 text-xs" />
                </li>
              );
            })}
          </ul>
          <ul className="flex min-w-max space-x-6 pb-3 text-lg font-bold text-gray-400">
            {secondaryTabs.map((tab) => (
              <li className="cursor-pointer transition-colors hover:text-gray-600" key={tab}>
                {tab}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1400px] flex-1 p-5 pb-20 md:p-8">
        {message ? <p className="mb-5 rounded-md bg-[#FCECDD] px-4 py-3 text-sm font-medium text-[#E75A22]">{message}</p> : null}

        {sections.map((section) => (
          <EstimateRequestSection
            key={section.title}
            loading={section.type === "pending" ? loading : false}
            section={section}
            sectionRef={(element) => {
              sectionRefs.current[section.title] = element;
            }}
            supplier={supplier}
          />
        ))}
      </div>
    </main>
  );
}

function EstimateRequestSection({
  loading,
  section,
  sectionRef,
  supplier
}: {
  loading: boolean;
  section: SectionConfig;
  sectionRef: (element: HTMLElement | null) => void;
  supplier: Supplier;
}) {
  const [selectedRequest, setSelectedRequest] = useState<EstimateRequest | null>(null);
  const columns: TableColumnsType<EstimateRequest> = [
    {
      align: "center",
      render: (_, estimateRequest) => (
        <button
          className="rounded-full bg-[#FCECDD] px-3 py-1 text-xs font-semibold text-[#E75A22] transition-colors hover:bg-[#F8D9C5]"
          type="button"
          onClick={() => setSelectedRequest(estimateRequest)}
        >
          {section.type === "pending" ? "접수" : "상세"}
        </button>
      ),
      title: "",
      width: 96
    },
    {
      align: "center",
      render: (_, estimateRequest) => formatEstimateRequestNumber(estimateRequest),
      title: "주문번호"
    },
    {
      align: "center",
      render: (_, estimateRequest) => formatShortDate(estimateRequest.dateDiscard),
      title: "마감날짜"
    },
    {
      align: "center",
      render: (_, estimateRequest) => formatUnit(estimateRequest),
      title: "단위"
    },
    {
      align: "center",
      dataIndex: "count",
      title: "수량"
    },
    {
      align: "center",
      render: (_, estimateRequest) => formatSupplier(estimateRequest),
      title: "Supplier"
    },
    {
      align: "center",
      render: (_, estimateRequest) => estimateRequest.catalogNo || "-",
      title: "Catalog No."
    },
    {
      align: "center",
      render: (_, estimateRequest) => estimateRequest.casNo || "-",
      title: "CAS No."
    },
    {
      render: (_, estimateRequest) => (
        <div className="max-w-[240px]" title={estimateRequest.productName}>
          <p className="truncate font-medium">{estimateRequest.productName}</p>
          {estimateRequest.note ? <p className="mt-1 truncate text-xs text-gray-500">{estimateRequest.note}</p> : null}
        </div>
      ),
      title: "상품명",
      width: 260
    },
    {
      align: "center",
      render: () =>
        section.type === "pending" ? (
          <AntButton className="min-w-20" shape="round" size="small">
            요청
          </AntButton>
        ) : (
          <span className="text-gray-500">-</span>
        ),
      title: <SectionActionLabel type={section.type} />,
      width: 112
    }
  ];

  return (
    <section className="mb-12 scroll-mt-[148px]" data-section-title={section.title} ref={sectionRef}>
      <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
        {section.title}
        <CountBadge count={section.count} className="ml-2 h-7 w-7 text-sm" />
      </h2>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table
          className="eps-main-table"
          columns={columns}
          dataSource={section.rows}
          loading={loading}
          locale={{ emptyText: section.emptyText }}
          pagination={{
            pageSize: ROWS_PER_PAGE,
            position: ["bottomRight"],
            showSizeChanger: false
          }}
          size="small"
          rowKey="id"
          scroll={{ x: 1040 }}
        />
      </div>
      <Modal
        visible={Boolean(selectedRequest)}
        title={
          <span className="text-2xl font-bold text-black">
            견적서 작성 <span className="ml-3 text-lg font-semibold text-gray-400">{selectedRequest ? formatEstimateRequestNumber(selectedRequest) : ""}</span>
          </span>
        }
        onClose={() => setSelectedRequest(null)}
        width={1180}
        content={
          selectedRequest ? (
            <EstimateRequestModalContent request={selectedRequest} supplier={supplier} onClose={() => setSelectedRequest(null)} />
          ) : null
        }
      />
    </section>
  );
}

function EstimateRequestModalContent({ onClose, request, supplier }: { onClose: () => void; request: EstimateRequest; supplier: Supplier }) {
  const unitLabel = formatUnitLabel(request);
  const supplierLabel = formatSupplier(request);

  return (
    <Form
      className="pb-1 pt-2"
      initialValues={{
        catalogNo: request.catalogNo,
        casNo: request.casNo,
        count: request.count,
        productName: request.productName,
        supplier: supplierLabel,
        unit: unitLabel || undefined,
        unitValue: request.unitValue
      }}
      layout="vertical"
      onFinish={onClose}
    >
      <Space className="w-full" orientation="vertical" size={20}>
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={9}>
            <Card className="h-full bg-gray-100" variant="outlined" title={<span className="text-2xl font-medium text-black">견적요청서</span>}>
              <Descriptions
                className="eps-info-descriptions"
                column={1}
                colon={false}
                items={[
                  { label: "요청일시", children: formatDateTime(request.dateCreated) },
                  { label: "마감날짜", children: formatDateTime(request.dateDiscard) },
                  { label: "상품명", children: request.productName },
                  { label: "CAS No.", children: request.casNo || "-" },
                  { label: "Supplier", children: supplierLabel },
                  { label: "Catalog No.", children: <span className="text-voronoi-orange underline underline-offset-2">{request.catalogNo || "-"}</span> },
                  { label: "단위", children: formatUnit(request) },
                  { label: "수량", children: request.count }
                ]}
              />
            </Card>
          </Col>

          <Col className="flex flex-col" xs={24} lg={15}>
            <Row className="w-full" gutter={[16, 12]}>
              <Col xs={24} md={8}>
                <Form.Item label="상품명" name="productName" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Supplier" name="supplier" rules={[{ required: true }]}>
                  <Select options={[{ label: supplierLabel, value: supplierLabel }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Catalog No." name="catalogNo" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>단가</span>
                      <span className="text-xs text-voronoi-orange">※부가세제외</span>
                    </span>
                  }
                  name="unitPrice"
                  rules={[{ required: true }]}
                >
                  <Space.Compact className="w-full">
                    <InputNumber className="w-full" min={0} />
                    <Input className="eps-static-addon w-12 cursor-default bg-gray-50 text-center text-gray-900" readOnly value="원" />
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="단위" required>
                  <Space.Compact className="w-full">
                    <Form.Item className="mb-0 w-full" name="unitValue" noStyle rules={[{ required: true }]}>
                      <InputNumber className="w-full" min={0} />
                    </Form.Item>
                    <Form.Item name="unit" noStyle rules={[{ required: true }]}>
                      <Select className="!w-24" options={unitLabel ? [{ label: unitLabel, value: unitLabel }] : []} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="수량" name="count" rules={[{ required: true }]}>
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>CAS</span>
                      <Checkbox>대체품</Checkbox>
                    </span>
                  }
                  name="casNo"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="배송기한" required>
                  <div className="flex w-full items-center gap-2">
                    <Select className="flex-1" options={[]} />
                    <span className="text-gray-400">~</span>
                    <Select className="flex-1" options={[]} />
                    <Select className="w-20" value="주" options={[{ label: "주", value: "주" }]} />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label="Purity" name="purity">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label="Grade" name="grade">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <div className="mt-auto flex justify-end pr-4 text-base text-gray-500">
              <span className="mr-48">총 금액</span>
              <span>원</span>
            </div>
          </Col>
        </Row>

        <Row className="items-stretch" gutter={[20, 20]}>
          <Col className="flex" xs={24} lg={9}>
            <Card
              className="min-h-[230px] w-full bg-gray-100"
              bordered={false}
              extra={
                <AntButton className="!bg-voronoi-orange !text-white" shape="round" type="primary">
                  수정
                </AntButton>
              }
              title={<span className="text-2xl font-medium text-black">담당업체정보</span>}
            >
              <Descriptions
                className="eps-info-descriptions"
                column={1}
                colon={false}
                items={[
                  { label: "업체", children: supplier.companyName },
                  { label: "담당자", children: supplier.contactName || "-" },
                  { label: "휴대폰", children: supplier.mobilePhone || "-" },
                  { label: "이메일", children: supplier.email }
                ]}
              />
            </Card>
          </Col>

          <Col className="flex" xs={24} lg={15}>
            <Row className="w-full items-stretch" gutter={[16, 16]}>
              <Col className="flex" xs={24} md={12}>
                <Form.Item className="eps-fill-form-item mb-0 w-full" name="note">
                  <Input.TextArea className="eps-fill-textarea" placeholder="특이사항" />
                </Form.Item>
              </Col>
              <Col className="flex" xs={24} md={12}>
                <Form.Item className="eps-fill-form-item mb-0 w-full" name="quoteFile">
                  <Upload.Dragger beforeUpload={() => false} className="eps-estimate-upload" maxCount={1}>
                    <div className="flex h-full min-h-[230px] flex-col items-center justify-center text-gray-400">
                      <PaperClipOutlined className="mb-2 text-4xl" />
                      <p className="mb-1 text-lg">견적서</p>
                      <p className="mb-4 text-lg">pdf, jpg, png 첨부 가능</p>
                      <AntButton className="!bg-[#555] !px-6 !font-semibold !text-white" size="large">
                        파일 가져오기
                      </AntButton>
                    </div>
                  </Upload.Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        <div className="flex justify-end gap-3 pt-1">
          <AntButton className="!h-10 !px-6" size="large" onClick={onClose}>
            닫기
          </AntButton>
          <AntButton className="!h-10 !bg-voronoi-orange !px-6 !font-bold" htmlType="submit" size="large" type="primary">
            접수하기
          </AntButton>
        </div>
      </Space>
    </Form>
  );
}

function SectionActionLabel({ type }: { type: SectionConfig["type"] }) {
  if (type === "completed") {
    return <>견적개수</>;
  }
  if (type === "selecting") {
    return (
      <span className="inline-flex items-center justify-center">
        상태
        <QuestionCircleOutlined className="ml-1 text-xs opacity-75" />
      </span>
    );
  }
  return <></>;
}

function CountBadge({ active = true, className, count }: { active?: boolean; className?: string; count: number }) {
  const colorClass = active ? "bg-[#E75A22] opacity-100" : "bg-gray-400 opacity-0 group-hover:opacity-100";

  return <span className={`flex items-center justify-center rounded-full font-semibold text-white transition-opacity ${colorClass} ${className ?? ""}`}>{count}</span>;
}

function isRequestStatus(request: EstimateRequest, statuses: string[]) {
  const status = (request.status ?? "").trim().toLowerCase();
  return statuses.map((item) => item.toLowerCase()).includes(status);
}

function formatEstimateRequestNumber(request: EstimateRequest) {
  if (request.purchaseRequest) {
    return request.purchaseRequest;
  }
  return `ER-${String(request.id).padStart(6, "0")}`;
}

function formatSupplier(request: EstimateRequest) {
  return request.supplierId ? `Supplier #${request.supplierId}` : "-";
}

function formatUnit(request: EstimateRequest) {
  const unit = request.unit == null ? "" : String(request.unit).trim();
  if (!unit) {
    return "-";
  }
  return `${request.unitValue} ${unit}`;
}

function formatUnitLabel(request: EstimateRequest) {
  return request.unit == null ? "" : String(request.unit).trim();
}

function formatShortDate(value: string | null) {
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
    year: "2-digit"
  })
    .format(date)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function formatDateTime(value: string | null) {
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
    year: "numeric"
  })
    .format(date)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}
