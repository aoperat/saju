import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "saju_wishlist";

/**
 * 찜하기 기능 훅
 * localStorage를 사용하여 찜 목록 관리
 */
export const useWishlist = () => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // localStorage와 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error("찜 목록 저장 실패:", error);
    }
  }, [wishlist]);

  // 찜하기 토글
  const toggle = useCallback((productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  // 찜 여부 확인
  const isWishlisted = useCallback(
    (productId) => wishlist.includes(productId),
    [wishlist]
  );

  // 찜 목록 전체 삭제
  const clearAll = useCallback(() => {
    setWishlist([]);
  }, []);

  // 찜 목록 개수
  const count = wishlist.length;

  return {
    wishlist,
    toggle,
    isWishlisted,
    clearAll,
    count,
  };
};

export default useWishlist;
