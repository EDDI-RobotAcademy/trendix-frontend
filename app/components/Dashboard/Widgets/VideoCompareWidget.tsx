'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { extractVideoId, ingestAndGetAnalysis } from '@/app/lib/api/videos';
import type { VideoAnalysis } from '@/app/lib/api/types';

// --- VideoCompareClient.tsx에서 가져온 로직과 타입 ---
interface CompareVideo {
    id: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    viewGrowthRate: number; // 조회수 증가율 (%)
    likeRatio: number; // 좋아요 비율 (%)
    tags: string[];
}

// VideoAnalysis를 CompareVideo로 변환
function videoAnalysisToCompareVideo(analysis: VideoAnalysis): CompareVideo {
    const video = analysis.video;

    // 좋아요 비율 계산 (좋아요 / 조회수 * 100)
    const likeRatio = video.view_count > 0
        ? (video.like_count / video.view_count) * 100
        : 0;

    // 키워드를 태그로 변환 (상위 5개)
    const tags = analysis.keywords
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(k => k.keyword);

    return {
        id: video.video_id,
        title: video.title,
        channelName: video.channel_id, // 채널 ID 사용
        thumbnailUrl: `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`,
        viewCount: video.view_count,
        likeCount: video.like_count,
        commentCount: video.comment_count,
        viewGrowthRate: 0, // TODO: 히스토리 데이터에서 계산 필요
        likeRatio,
        tags,
    };
}

function formatNumber(num: number): string {
    if (num >= 10000) return (num / 10000).toFixed(1) + '만';
    return num.toLocaleString();
}

function getWinner(a: number, b: number): 'A' | 'B' | 'tie' {
    if (a > b) return 'A';
    if (b > a) return 'B';
    return 'tie';
}

// --- 위젯용으로 재구성된 UI 및 로직 ---

interface CompactVideoInputProps {
    label: string;
    videoUrl: string;
    onUrlChange: (url: string) => void;
    onAnalyze: () => void;
    loading: boolean;
    error?: string | null;
}

function CompactVideoInput({ label, videoUrl, onUrlChange, onAnalyze, loading, error }: CompactVideoInputProps) {
    return (
        <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>{label}</label>
            <div className='flex gap-2'>
                <input
                    type='text'
                    value={videoUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder='영상 URL 또는 ID 입력'
                    className={`flex-1 px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none ${
                        error ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <button
                    onClick={onAnalyze}
                    disabled={loading || !videoUrl.trim()}
                    className='px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed'
                >
                    {loading ? <Icon icon="mdi:loading" className="animate-spin" /> : '분석'}
                </button>
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
}

const VideoCompareWidget = () => {
    const [videoUrlA, setVideoUrlA] = useState('');
    const [videoUrlB, setVideoUrlB] = useState('');
    const [videoA, setVideoA] = useState<CompareVideo | null>(null);
    const [videoB, setVideoB] = useState<CompareVideo | null>(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);
    const [errorA, setErrorA] = useState<string | null>(null);
    const [errorB, setErrorB] = useState<string | null>(null);

    const analyzeVideoA = async () => {
        setLoadingA(true);
        setErrorA(null);

        try {
            const videoId = extractVideoId(videoUrlA);
            if (!videoId) {
                throw new Error('유효하지 않은 YouTube URL입니다.');
            }

            const analysis = await ingestAndGetAnalysis(videoId);
            setVideoA(videoAnalysisToCompareVideo(analysis));
        } catch (error) {
            console.error('영상 A 분석 실패:', error);
            setErrorA(error instanceof Error ? error.message : '영상 분석에 실패했습니다.');
            setVideoA(null);
        } finally {
            setLoadingA(false);
        }
    };

    const analyzeVideoB = async () => {
        setLoadingB(true);
        setErrorB(null);

        try {
            const videoId = extractVideoId(videoUrlB);
            if (!videoId) {
                throw new Error('유효하지 않은 YouTube URL입니다.');
            }

            const analysis = await ingestAndGetAnalysis(videoId);
            setVideoB(videoAnalysisToCompareVideo(analysis));
        } catch (error) {
            console.error('영상 B 분석 실패:', error);
            setErrorB(error instanceof Error ? error.message : '영상 분석에 실패했습니다.');
            setVideoB(null);
        } finally {
            setLoadingB(false);
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col p-3 overflow-y-auto">
            {/* Input Section */}
            <div className="flex flex-col gap-3 mb-3">
                <CompactVideoInput
                    label='영상 A'
                    videoUrl={videoUrlA}
                    onUrlChange={setVideoUrlA}
                    onAnalyze={analyzeVideoA}
                    loading={loadingA}
                    error={errorA}
                />
                <CompactVideoInput
                    label='영상 B'
                    videoUrl={videoUrlB}
                    onUrlChange={setVideoUrlB}
                    onAnalyze={analyzeVideoB}
                    loading={loadingB}
                    error={errorB}
                />
            </div>

            {/* Result Section */}
            {videoA && videoB ? (
                <div className="flex-1 flex flex-col">
                    <div className='grid grid-cols-2 gap-2 mb-2'>
                        {[videoA, videoB].map((video, index) => (
                             <div key={index} className="text-center">
                                <div className="relative w-full aspect-video rounded-md overflow-hidden mb-1">
                                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                                </div>
                                <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                            </div>
                        ))}
                    </div>

                    <div className='bg-gray-50 rounded-lg p-2 text-xs'>
                        <div className="flex justify-between items-center py-1 border-b">
                            <span className={`font-bold ${getWinner(videoA.viewCount, videoB.viewCount) === 'A' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoA.viewCount)}</span>
                            <span className="text-gray-500">조회수</span>
                            <span className={`font-bold ${getWinner(videoA.viewCount, videoB.viewCount) === 'B' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoB.viewCount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                            <span className={`font-bold ${getWinner(videoA.likeCount, videoB.likeCount) === 'A' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoA.likeCount)}</span>
                            <span className="text-gray-500">좋아요</span>
                            <span className={`font-bold ${getWinner(videoA.likeCount, videoB.likeCount) === 'B' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoB.likeCount)}</span>
                        </div>
                         <div className="flex justify-between items-center py-1">
                            <span className={`font-bold ${getWinner(videoA.commentCount, videoB.commentCount) === 'A' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoA.commentCount)}</span>
                            <span className="text-gray-500">댓글</span>
                            <span className={`font-bold ${getWinner(videoA.commentCount, videoB.commentCount) === 'B' ? 'text-blue-600' : 'text-gray-700'}`}>{formatNumber(videoB.commentCount)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50 rounded-lg p-4">
                    <Icon icon="mdi:video-compare-outline" className="text-4xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">비교할 두 영상의 URL을 입력해주세요.</p>
                </div>
            )}
        </div>
    );
};

export default VideoCompareWidget;
