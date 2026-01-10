// 대시보드 레이아웃 API 호출 함수

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface DashboardLayoutData {
  widgets: any[];  // 위젯 목록
  layouts: any;    // react-grid-layout 레이아웃 데이터
}

/**
 * 대시보드 레이아웃을 불러옵니다.
 * @param accountId - 계정 ID
 * @returns 대시보드 레이아웃 데이터
 */
export async function fetchDashboardLayout(accountId: string): Promise<DashboardLayoutData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/accounts/${accountId}/dashboard-layout`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // 쿠키 포함 (세션 인증)
        cache: 'no-store',  // 항상 최신 데이터 가져오기
      }
    );

    if (!response.ok) {
      // 404는 아직 저장된 레이아웃이 없는 경우
      if (response.status === 404) {
        return { widgets: [], layouts: {} };
      }
      throw new Error(`레이아웃 조회 실패: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('대시보드 레이아웃 조회 실패:', error);
    // 에러 발생 시 빈 레이아웃 반환
    return { widgets: [], layouts: {} };
  }
}

/**
 * 대시보드 레이아웃을 저장합니다.
 * @param accountId - 계정 ID
 * @param widgets - 위젯 목록
 * @param layouts - react-grid-layout 레이아웃 데이터
 */
export async function saveDashboardLayout(
  accountId: string,
  widgets: any[],
  layouts: any
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/accounts/${accountId}/dashboard-layout`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // 쿠키 포함 (세션 인증)
        body: JSON.stringify({
          widgets,
          layouts,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `레이아웃 저장 실패: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error('대시보드 레이아웃 저장 실패:', error);
    throw error;
  }
}
