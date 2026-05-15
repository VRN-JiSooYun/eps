import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, LogOut } from "lucide-react";
import type { QuoteRequest, Supplier } from "../../types";

type MainPageProps = {
  loading: boolean;
  message: string;
  onLogout: () => void;
  quotes: QuoteRequest[];
  supplier: Supplier;
};

type SectionConfig = {
  count: number;
  emptyText: string;
  rows: QuoteRequest[];
  title: string;
  type: "pending" | "completed" | "selecting";
};

const tabs = ["견적대기", "견적완료", "선정중", "납품요청", "배송중", "납품완료"];
const secondaryTabs = ["미선정", "주문취소"];
const STICKY_HEIGHT = 180;

export function MainPage({ loading, message, onLogout, quotes, supplier }: MainPageProps) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingCount = quotes.length;
  const displayName = supplier.contactName || supplier.companyName || supplier.email;
  const sections: SectionConfig[] = [
    {
      count: pendingCount,
      emptyText: "대기 중인 견적 요청이 없습니다.",
      rows: quotes,
      title: "견적대기",
      type: "pending"
    },
    {
      count: 0,
      emptyText: "완료된 견적이 없습니다.",
      rows: [],
      title: "견적완료",
      type: "completed"
    },
    {
      count: 0,
      emptyText: "선정 중인 견적이 없습니다.",
      rows: [],
      title: "선정중",
      type: "selecting"
    },
    {
      count: 0,
      emptyText: "납품요청 중인 견적이 없습니다.",
      rows: [],
      title: "납품요청",
      type: "selecting"
    },
    {
      count: 0,
      emptyText: "배송 중인 견적이 없습니다.",
      rows: [],
      title: "배송중",
      type: "selecting"
    },
    {
      count: 0,
      emptyText: "납품 완료된 견적이 없습니다.",
      rows: [],
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
  }, [loading, quotes]);

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
  }, [quotes]);

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
            <Bell className="h-5 w-5" />
            {pendingCount > 0 ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-white" /> : null}
          </button>
          <button className="flex items-center transition-colors hover:text-gray-200" type="button" onClick={onLogout} title="로그아웃">
            <span className="mr-2 font-medium">{displayName}님</span>
            <ChevronDown className="h-4 w-4" />
            <LogOut className="ml-3 h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="sticky top-[64px] z-40 border-b border-gray-200 bg-white px-6">
        <div className="flex items-end justify-between overflow-x-auto">
          <ul className="flex min-w-max space-x-8 pt-4 text-lg font-bold text-gray-500">
            {tabs.map((tab, index) => (
              <li
                onClick={() => scrollToSection(tab)}
                className={`group flex cursor-pointer items-center border-b-4 pb-3 transition-colors ${
                  selectedTab === tab
                    ? "border-[#E75A22] text-[#E75A22]"
                    : "border-transparent hover:border-gray-300 hover:text-gray-700"
                }`}
                key={tab}
              >
                {tab}
                {/* {index === 0 ? <CountBadge active={selectedTab === tab} count={pendingCount} className="ml-2 h-6 w-6 text-xs" /> : null} */}
              </li>
            ))}
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
          <QuoteSection
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

function QuoteSection({
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
  return (
    <section className="mb-12 scroll-mt-[148px]" data-section-title={section.title} ref={sectionRef}>
      <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
        {section.title}
        <CountBadge count={section.count} className="ml-2 h-7 w-7 text-sm" />
      </h2>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-center text-sm text-gray-700">
            <thead className="bg-[#E75A22] font-medium text-white">
              <tr>
                <th className="w-24 px-4 py-3"></th> {/* 액션 */}
                <th className="px-4 py-3">주문번호</th>
                <th className="px-4 py-3">마감날짜</th>
                <th className="px-4 py-3">단위</th>
                <th className="px-4 py-3">수량</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Catalog No.</th>
                <th className="px-4 py-3">CAS No.</th>
                <th className="w-64 px-4 py-3 text-left">상품명</th>
                <th className="w-28 px-4 py-3">
                  <SectionActionLabel type={section.type} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-gray-500" colSpan={10}>
                    불러오는 중입니다.
                  </td>
                </tr>
              ) : null}

              {!loading && section.rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-gray-500" colSpan={10}>
                    {section.emptyText}
                  </td>
                </tr>
              ) : null}

              {!loading
                ? section.rows.map((quote) => (
                    <tr className="h-16 transition-colors hover:bg-gray-50" key={quote.id}>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-[#FCECDD] px-3 py-1 text-xs font-semibold text-[#E75A22]">{section.type === "pending" ? "접수" : "상세"}</span>
                      </td>
                      <td className="px-4 py-2">{quote.requestNumber}</td>
                      <td className="px-4 py-2">{formatShortDate(quote.dueDate)}</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">{supplier.companyName}</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">-</td>
                      <td className="max-w-[240px] px-4 py-2 text-left" title={quote.title}>
                        <p className="truncate font-medium">{quote.title}</p>
                        {quote.description ? <p className="mt-1 truncate text-xs text-gray-500">{quote.description}</p> : null}
                      </td>
                      <td className="px-4 py-2">
                        {section.type === "pending" ? (
                          <button className="w-full rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200" type="button">
                            요청
                          </button>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
          <button className="p-1 text-gray-400 transition-colors hover:text-gray-600" type="button" aria-label="이전 페이지">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="mx-3">1 / 1</span>
          <button className="p-1 text-gray-400 transition-colors hover:text-gray-600" type="button" aria-label="다음 페이지">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
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
        <CircleHelp className="ml-1 h-3.5 w-3.5 opacity-75" />
      </span>
    );
  }
  return <></>;
}

function CountBadge({ active = true, className, count }: { active?: boolean; className?: string; count: number }) {
  const colorClass = active ? "bg-[#E75A22]" : "bg-gray-300 group-hover:bg-gray-400";

  return <span className={`flex items-center justify-center rounded-full font-semibold text-white transition-colors ${colorClass} ${className ?? ""}`}>{count}</span>;
}

function formatShortDate(value: string) {
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
