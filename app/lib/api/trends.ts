// 급등 영상 API 호출 함수

import { SurgeVideo, SurgeVideoResponse, APIError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface FetchSurgeVideosParams {
  platform?: string;
  limit?: number;
  days?: number;
  velocity_days?: number;
}

/**
 * 급등 영상 목록을 가져옵니다.
 * @param params - 조회 파라미터
 * @returns 급등 영상 배열
 */
export async function fetchSurgeVideos(
  params?: FetchSurgeVideosParams
): Promise<SurgeVideo[]> {
  const searchParams = new URLSearchParams({
    platform: params?.platform || 'youtube',
    limit: String(params?.limit || 10),
    days: String(params?.days || 14),
    velocity_days: String(params?.velocity_days || 1),
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/trends/videos/surge?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Next.js 캐싱 전략: 5분마다 재검증
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `급등 영상 조회 실패: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: SurgeVideoResponse = await response.json();
    return data.items;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      0
    );
  }
}
