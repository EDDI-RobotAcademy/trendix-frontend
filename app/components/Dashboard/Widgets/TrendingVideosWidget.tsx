'use client';

import { useEffect, useState } from 'react';
import VideoCard, { Video } from '@/app/components/Home/TrendingVideos/VideoCard';
import CategoryTabs, { youtubeCategories, Category } from '@/app/components/Home/TrendingVideos/CategoryTabs';
import { fetchSurgeVideos } from '@/app/lib/api/trends';
import type { SurgeVideo } from '@/app/lib/api/types';

// SurgeVideo를 Video 타입으로 변환
function surgeVideoToVideo(surgeVideo: SurgeVideo): Video {
    // 급등 이유 생성
    let trendingReason = '';
    if (surgeVideo.surge_score > 80) {
        trendingReason = `급등 점수 ${surgeVideo.surge_score.toFixed(1)} - 초고속 성장`;
    } else if (surgeVideo.delta_views_window > 100000) {
        trendingReason = `조회수 ${(surgeVideo.delta_views_window / 10000).toFixed(1)}만 급등`;
    } else if (surgeVideo.growth_rate_window > 1.0) {
        trendingReason = `증가율 ${(surgeVideo.growth_rate_window * 100).toFixed(0)}% 급상승`;
    } else {
        trendingReason = '트렌딩 중';
    }

    return {
        id: surgeVideo.video_id,
        title: surgeVideo.title,
        channelName: surgeVideo.channel_username?.replace('@', '') || surgeVideo.channel_id,
        channelId: surgeVideo.channel_id,
        thumbnailUrl: surgeVideo.thumbnail_url || 'https://picsum.photos/400/225',
        viewCount: surgeVideo.view_count,
        viewCountChange: surgeVideo.delta_views_window,
        likeCount: surgeVideo.like_count,
        likeCountChange: surgeVideo.like_count - surgeVideo.like_count_prev,
        publishedAt: surgeVideo.published_at || new Date().toISOString(),
        duration: surgeVideo.duration || '0:00',
        categoryId: surgeVideo.category_id?.toString() || '0',
        isShort: surgeVideo.is_shorts || false,
        trendingRank: surgeVideo.trending_rank,
        trendingReason,
    };
}

interface TrendingVideosWidgetProps {
    onVideoClick: (video: Video) => void;
}

const TrendingVideosWidget = ({ onVideoClick }: TrendingVideosWidgetProps) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        async function loadVideos() {
            try {
                setLoading(true);
                setError(null);

                if (selectedCategory === 'all') {
                    // 전체 급등 영상
                    const surgeVideos = await fetchSurgeVideos({
                        platform: 'youtube',
                        limit: 10,
                        days: 14,
                        velocity_days: 1,
                    });

                    const convertedVideos = surgeVideos.map(surgeVideoToVideo);
                    setVideos(convertedVideos);
                } else {
                    // 카테고리별 추천 영상
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/trends/menu?category_id=${encodeURIComponent(selectedCategory)}&limit=10&days=14&platform=youtube`,
                        {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            cache: 'no-store',
                        }
                    );

                    if (!response.ok) {
                        // throw new Error('카테고리 영상을 불러오지 못했습니다.');
                        setError('카테고리 영상을 불러오지 못했습니다.');
                        setVideos([]);
                        return;
                    }

                    const data = await response.json();
                    const items: any[] = data.items ?? [];

                    const convertedVideos: Video[] = items.map((item, index) => ({
                        id: item.video_id,
                        title: item.title,
                        channelName: item.channel_username?.replace('@', '') || item.channel_id,
                        channelId: item.channel_id,
                        thumbnailUrl: item.thumbnail_url,
                        viewCount: item.view_count,
                        viewCountChange: 0,
                        likeCount: item.like_count ?? 0,
                        likeCountChange: 0,
                        publishedAt: item.published_at,
                        duration: '',
                        categoryId: String(item.category_id ?? item.category ?? selectedCategory),
                        isShort: item.is_shorts || false,
                        trendingRank: index + 1,
                        trendingReason: `${item.category ?? selectedCategory} 카테고리 추천`,
                    }));

                    setVideos(convertedVideos);
                }
            } catch (err) {
                console.error('급등 영상 로딩 실패:', err);
                setError(err instanceof Error ? err.message : '급등 영상을 불러오지 못했습니다.');
                setVideos([]); // 오류 발생 시 비디오 목록을 비웁니다.
            } finally {
                setLoading(false);
            }
        }

        loadVideos();
    }, [selectedCategory]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">급등 영상을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-600">급등 영상이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* 카테고리 탭 */}
            <div className="px-3 pt-3 pb-2 border-b">
                <CategoryTabs
                    categories={youtubeCategories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
            </div>

            {/* 영상 그리드 */}
            <div className="flex-1 overflow-y-auto p-3">
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
                >
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} onVideoClick={onVideoClick} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrendingVideosWidget;
