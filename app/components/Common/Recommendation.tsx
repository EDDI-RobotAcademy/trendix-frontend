'use client'

import { useEffect, useState } from "react";
import { VideoCard } from "./VideoCard";
import { Interest } from "@/types/userInfo";
import { categoryList } from "@/app/actions/categoryList";
import { useInterestList } from "@/context/InterestContext";
import Link from "next/link";


// Skeleton component for loading state
const VideoCardSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg aspect-video mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
);


export const Recommendation = ({ userCategory, userInterests }: { userCategory?: Interest; userInterests?: Interest[] }) => {
    const [recommendationLimit, setRecommendationLimit] = useState(8);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { interestList } = useInterestList();

    useEffect(() => {
        if (userCategory) {
            // Fetch for specific category
            setIsLoading(true);
            categoryList(userCategory.interest, 20).then((videos) => {
                setVideos(videos.items);
                setIsLoading(false);
            }).catch(() => {
                setIsLoading(false);
            });
        } else if (userInterests && userInterests.length > 0) {
            // Fetch from all user interests and flatten like in page.tsx
            setIsLoading(true);
            Promise.all(
                userInterests.map((interest) => categoryList(interest.interest, 4))
            ).then((allCategoryVideos) => {
                const flattenedList: Video[] = [];
                const maxLength = Math.max(...allCategoryVideos.map(cv => cv.items.length));
                for (let i = 0; i < maxLength; i++) {
                    for (const categoryVideos of allCategoryVideos) {
                        if (categoryVideos.items[i]) {
                            flattenedList.push({
                                ...categoryVideos.items[i]
                            });
                        }
                    }
                }
                setVideos(flattenedList);
                setIsLoading(false);
            }).catch(() => {
                setIsLoading(false);
            });
        }
    }, [userCategory, userInterests]);

    const loadMoreRecommendations = () => {
        setRecommendationLimit((prev) => Math.min(prev + 8, videos.length));
    };

    // Check if this is the mixed recommendations section (no userCategory) and user has no interests
    const showEmptyState = !userCategory && (!userInterests || userInterests.length === 0) && !isLoading;

    return (
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {userCategory?.interest ? userCategory?.interest : "✨ 회원님을 위한 맞춤 추천"}
                {interestList && interestList.length > 0 && interestList.map((item) => (
                    item.category === userCategory?.interest && (
                        <span key={item.category} className="text-gray-600 ml-2">({item.tags.join(', ')})</span>
                    )
                ))}
            </h2>

            {showEmptyState ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">관심사를 등록해주세요</h3>
                    <p className="text-gray-500 mb-6 text-center">
                        관심사를 등록하시면 맞춤 추천 영상을 받아보실 수 있습니다.
                    </p>
                    <Link
                        href="/user/detail"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                        관심사 등록하러 가기
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {isLoading ? (
                            // Show skeleton while loading
                            Array.from({ length: 8 }).map((_, idx) => (
                                <VideoCardSkeleton key={idx} />
                            ))
                        ) : (
                            // Show actual videos when loaded
                            videos && videos.length > 0 && videos.slice(0, recommendationLimit).map((video, idx) => (
                                <VideoCard key={idx} video={video} />
                            ))
                        )}
                    </div>

                    {!isLoading && recommendationLimit < videos?.length && (
                        <div className="flex justify-center">
                            <button
                                onClick={loadMoreRecommendations}
                                className="px-8 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                            >
                                더보기
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}