// 영상 메타데이터 및 분석 API 호출 함수

import { VideoAnalysis, VideoViewHistory, APIError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * YouTube URL에서 video_id를 추출합니다.
 * @param url - YouTube URL (watch?v=, shorts/, youtu.be 등 지원)
 * @returns video_id 또는 null
 */
export function extractVideoId(url: string): string | null {
  try {
    // URL 객체로 파싱
    const urlObj = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }

    // youtube.com/shorts/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/')[2];
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // '/' 제거
    }

    return null;
  } catch (error) {
    // URL 파싱 실패 시 직접 video_id로 간주
    // YouTube video_id는 11자리 영숫자
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }
    return null;
  }
}

/**
 * YouTube 영상 데이터를 수집합니다.
 * @param videoId - YouTube 영상 ID
 * @returns 수집 결과
 */
export async function ingestVideo(videoId: string): Promise<{ message: string; video_id: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingestion/youtube/video/${videoId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 수집은 캐시하지 않음
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `영상 수집 실패: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
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

/**
 * 영상 분석 데이터를 가져옵니다.
 * @param videoId - YouTube 영상 ID
 * @returns 영상 분석 데이터 (메타데이터 + 키워드 + 감정 분석)
 */
export async function getVideoAnalysis(videoId: string): Promise<VideoAnalysis> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingestion/youtube/video/${videoId}/analysis`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 분석 데이터는 5분마다 재검증
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 404는 아직 수집되지 않은 영상
      if (response.status === 404) {
        throw new APIError(
          '영상 데이터가 없습니다. 먼저 수집을 진행해주세요.',
          404,
          errorData
        );
      }

      throw new APIError(
        errorData.detail || `영상 분석 조회 실패: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: VideoAnalysis = await response.json();
    return data;
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

/**
 * 영상의 조회수 히스토리를 가져옵니다.
 * @param videoId - YouTube 영상 ID
 * @returns 시계열 조회수 데이터
 */
export async function getVideoViewHistory(videoId: string): Promise<VideoViewHistory> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingestion/youtube/video/${videoId}/history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 히스토리 데이터는 1시간마다 재검증
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 404는 히스토리 데이터가 아직 없는 경우
      if (response.status === 404) {
        throw new APIError(
          '조회수 히스토리 데이터가 없습니다.',
          404,
          errorData
        );
      }

      throw new APIError(
        errorData.detail || `히스토리 조회 실패: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data: VideoViewHistory = await response.json();
    return data;
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

/**
 * 영상을 수집하고 분석 데이터를 가져옵니다. (편의 함수)
 * @param videoId - YouTube 영상 ID
 * @returns 영상 분석 데이터
 */
export async function ingestAndGetAnalysis(videoId: string): Promise<VideoAnalysis> {
  // 먼저 수집 시도
  await ingestVideo(videoId);

  // 수집 후 약간의 지연 (백엔드 처리 시간 고려)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 분석 데이터 조회
  return await getVideoAnalysis(videoId);
}
