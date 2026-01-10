// 백엔드 API 응답 타입 정의

// 급등 영상 관련 타입
export interface SurgeVideo {
  video_id: string;
  title: string;
  description: string | null;
  tags: string | null;
  category_id: number | null;
  category: string | null;  // AI 분석 카테고리
  duration: string | null;
  channel_id: string;
  channel_username?: string;  // 채널 유저네임 (@포함)
  platform: string;

  // 조회수 데이터
  view_count: number;
  view_count_prev: number;
  view_velocity: number;    // 일일 증가량

  // 좋아요/댓글 데이터
  like_count: number;
  like_count_prev: number;
  like_velocity: number;
  comment_count: number;
  comment_count_prev: number;
  comment_velocity: number;

  // 점수 데이터
  total_score: number;
  surge_score: number;      // 급등 점수 (핵심 지표)
  freshness_score: number;  // 신선도 점수 (0~1)
  freshness_score_with_bonus: number;

  // 경과 시간
  age_seconds: number | null;
  age_minutes: number | null;
  age_hours: number | null;
  age_days: number | null;

  // 증가 지표
  delta_views_window: number;
  growth_rate_window: number;

  // 메타데이터
  published_at: string | null;
  thumbnail_url: string | null;
  crawled_at: string | null;
  is_shorts: boolean | null;

  // 상세 점수 분석
  surge_components: {
    growth_factor: number;
    velocity_factor: number;
    popularity_factor: number;
    freshness_factor: number;
  };
  trending_rank?: number;
  freshness_bonus?: number;
}

export interface SurgeVideoResponse {
  items: SurgeVideo[];
}

// 영상 분석 관련 타입
export interface VideoAnalysis {
  video: {
    video_id: string;
    title: string;
    channel_id: string;
    platform: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    category: string | null;
    sentiment_label: string | null;
    sentiment_score: number | null;
    trend_score: number | null;
    keywords: string | null;
    summary: string | null;
    analyzed_at: string | null;
    engagement_score: number | null;
    score_sentiment: number | null;
    score_trend: number | null;
    total_score: number | null;
  };
  keywords: Array<{
    keyword: string;
    weight: number;
    platform: string;
    video_id: string;
    channel_id: string;
  }>;
  comment_sentiments: Array<{
    comment_id: string;
    video_id: string;
    platform: string;
    sentiment_label: string;
    sentiment_score: number;
    analyzed_at: string;
  }>;
}

// 조회수 히스토리 관련 타입
export interface VideoViewHistory {
  video_id: string;
  platform: string;
  history: Array<{
    snapshot_date: string;
    view_count: number;
    like_count: number | null;
    comment_count: number | null;
  }>;
}

// 채널 분석 관련 타입
export interface ChannelVideo {
  video_id: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  is_surge: boolean;  // 급등 영상 여부
  surge_score?: number;
}

export interface ChannelAnalytics {
  channel_id: string;
  channel_title: string;
  subscriber_count: number;
  recent_videos: ChannelVideo[];
  avg_view_count: number;
  avg_like_count: number;
  surge_video_count: number;
}

// API 에러 타입
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
