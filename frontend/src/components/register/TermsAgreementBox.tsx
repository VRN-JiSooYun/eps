export function TermsAgreementBox() {
  return (
    <div className="terms-scroll relative min-h-0 flex-grow overflow-y-auto rounded-md bg-voronoi-gray-100 p-6 pr-8 text-base leading-relaxed text-gray-800 md:p-8 md:pr-12">
      <h2 className="mb-6 text-lg font-semibold">[필수] 공급업체 등록을 위한 개인정보 수집·이용 동의서</h2>

      <div className="space-y-6">
        <section>
          <h3 className="mb-1 font-medium">가. 개인정보 수집·이용자</h3>
          <ul className="list-none space-y-1 pl-4 text-gray-600">
            <li>회사명: 보로노이(주)</li>
            <li>주소: 인천광역시 연수구 송도과학로 32 IT센터 S동 18층</li>
            <li>연락처: 032-830-4855, voronoi.hr@voronoi.io</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-medium">나. 개인정보 수집·이용 목적</h3>
          <ul className="list-none space-y-1 pl-4 text-gray-600">
            <li>공급업체(거래처) 등록 및 자격 심사</li>
            <li>계약 체결 및 이행, 대금 지급 및 정산</li>
            <li>거래 관련 문의 및 공지사항 전달</li>
            <li>회원사별 거래 내역에 기반한 서비스 이용 통계·분석 및 서비스 품질 개선</li>
            <li>세금계산서 발행 등 회계·세무 처리</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-medium">다. 수집·이용하는 개인정보 항목 (필수)</h3>
          <ul className="list-none space-y-1 pl-4 text-gray-600">
            <li>업체 정보: 상호, 사업자등록번호, 주소, 대표자, 본사 전화번호, 법인등록번호, 영업 개시일</li>
            <li>사용자 정보: 이름, 직위, 부서, 이메일, 휴대폰 번호</li>
            <li>거래 정보: 거래은행, 계좌번호, 예금주명, 계좌구분(사업자/개인)</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-medium">라. 개인정보 보유·이용 기간</h3>
          <p className="pl-4 text-gray-600">
            공급업체 등록 일로부터 거래 종료 후 5년까지, 또는 관련 법령(상법, 국세기본법 등)에서 정한 기간 동안 보관 후 파기합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
