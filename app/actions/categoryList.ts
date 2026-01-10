'use server'
export const categoryList = async (category: string, count: number) => {

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trends/categories/${category}/recommendations?limit=${count}&days=90&platform=youtube `, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            method: 'GET',
        });

        // 404 응답 처리 (해당 카테고리에 추천 콘텐츠가 없는 경우)
        if (!res.ok) {
            //console.log(`카테고리 "${category}" 추천 콘텐츠 없음 (status: ${res.status})`);
            return { items: [] };
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.log(error);
        return { items: [] };
    }
}