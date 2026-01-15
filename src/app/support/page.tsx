export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">고객 지원</h1>

      <p className="text-gray-600 mb-6">
        여의도한끼 앱 이용에 관한 문의 및 지원 안내입니다.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">문의하기</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          앱 사용 중 문제가 발생하거나 문의사항이 있으시면 아래 이메일로 연락해 주세요.
          영업일 기준 24시간 이내에 답변드리겠습니다.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">
            <span className="font-semibold">이메일:</span>{" "}
            <a href="mailto:support@yeoidohanki.com" className="text-blue-600 hover:underline">
              support@yeoidohanki.com
            </a>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">자주 묻는 질문 (FAQ)</h2>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Q. 회원가입은 어떻게 하나요?</h3>
            <p className="text-gray-700">
              앱 하단의 &quot;마이페이지&quot; 탭에서 &quot;로그인/회원가입&quot; 버튼을 눌러 이메일과 비밀번호로 간편하게 가입할 수 있습니다.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Q. 리뷰는 어떻게 작성하나요?</h3>
            <p className="text-gray-700">
              맛집 상세 페이지에서 &quot;리뷰 작성&quot; 버튼을 눌러 별점과 함께 리뷰를 작성할 수 있습니다.
              리뷰 작성은 로그인 후 이용 가능합니다.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Q. 비밀번호를 잊어버렸어요.</h3>
            <p className="text-gray-700">
              로그인 화면에서 &quot;비밀번호 찾기&quot;를 통해 등록된 이메일로 비밀번호 재설정 링크를 받을 수 있습니다.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Q. 계정을 삭제하고 싶어요.</h3>
            <p className="text-gray-700">
              마이페이지 &gt; 설정 &gt; 계정 삭제에서 계정을 삭제할 수 있습니다.
              계정 삭제 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
          </div>

          <div className="pb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Q. 앱에서 오류가 발생해요.</h3>
            <p className="text-gray-700">
              앱을 최신 버전으로 업데이트하고, 기기를 재시작해 보세요.
              문제가 지속되면 이메일로 문의해 주세요. 오류 상황을 자세히 알려주시면 빠른 해결에 도움이 됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">앱 정보</h2>
        <ul className="text-gray-700 space-y-2">
          <li><span className="font-semibold">앱 이름:</span> 여의도한끼</li>
          <li><span className="font-semibold">버전:</span> 1.0</li>
          <li><span className="font-semibold">개발자:</span> Byungchul Park</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">관련 링크</h2>
        <ul className="text-gray-700 space-y-2">
          <li>
            <a href="/privacy" className="text-blue-600 hover:underline">
              개인정보 처리방침
            </a>
          </li>
        </ul>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-12 pt-8 border-t">
        <p>&copy; 2026 여의도한끼. All rights reserved.</p>
      </footer>
    </div>
  );
}
