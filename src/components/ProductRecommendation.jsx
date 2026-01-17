import { useState, useEffect } from "react";
import {
  getRecommendedProducts,
  ELEMENT_RECOMMENDATION_MESSAGE,
  ELEMENT_COLORS,
  getProductReason,
} from "../data/productService.js";
import { ELEMENT_INFO } from "../data/elementInfo.js";

const ProductRecommendation = ({ weakElements }) => {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!weakElements || weakElements.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const recommendedProducts = await getRecommendedProducts(weakElements);
      setProducts(recommendedProducts);
      setActiveTab(weakElements[0]?.name || null);
      setLoading(false);
    };

    fetchProducts();
  }, [weakElements]);

  // 탭 변경 시 페이지를 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  if (!weakElements || weakElements.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-stone-900/50 rounded-2xl border border-stone-800">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-400">추천 아이템 불러오는 중...</span>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  // 페이지네이션 계산
  const itemsPerPage = 2;
  const totalProducts = products[activeTab]?.length || 0;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const currentProducts = products[activeTab]?.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  ) || [];

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-stone-900/80 to-stone-800/50 rounded-2xl border border-amber-900/30">
      <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
        <span className="text-2xl">物</span>
        부족한 기운 보완 아이템
      </h3>

      <p className="text-sm text-stone-400 mb-6">
        부족한 오행의 기운을 보완해주는 아이템을 곁에 두면 좋습니다.
      </p>

      {/* 오행 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {weakElements.map((element) => {
          const info = ELEMENT_INFO[element.name];
          const isActive = activeTab === element.name;

          return (
            <button
              key={element.name}
              onClick={() => setActiveTab(element.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              <span className="text-lg">{info.hanja}</span>
              <span>{element.name}</span>
            </button>
          );
        })}
      </div>

      {/* 선택된 오행의 제품 목록 */}
      {activeTab && (
        <div>
          <p className="text-sm text-stone-300 mb-4">
            <span className={ELEMENT_INFO[activeTab]?.textColor}>
              {ELEMENT_INFO[activeTab]?.hanja}({activeTab})
            </span>
            의 기운 -{" "}
            <span className="text-stone-400">
              {ELEMENT_RECOMMENDATION_MESSAGE[activeTab]} 아이템
            </span>
          </p>

          {/* 캐러셀 네비게이션 및 상품 표시 */}
          {totalProducts > 0 ? (
            <div className="relative">
              {/* 상품 목록 (세로 배치) */}
              <div className="space-y-4 mb-4">
                {currentProducts.map((product) => (
                  <a
                    key={product.id}
                    href={product.coupang_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 p-4 bg-stone-800/50 rounded-xl border border-stone-700/50 hover:border-amber-600/50 hover:bg-stone-800 transition-all"
                  >
                    {/* 오행 색상 인디케이터 */}
                    <div
                      className={`w-1 rounded-full bg-gradient-to-b ${ELEMENT_COLORS[activeTab]?.gradient}`}
                    />

                    {/* 제품 이미지 */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stone-700">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/200x200/${
                            ELEMENT_INFO[activeTab]?.lightBg
                              ?.replace("bg-", "")
                              .split("-")[0] || "gray"
                          }/ffffff?text=${ELEMENT_INFO[activeTab]?.hanja}`;
                        }}
                      />
                    </div>

                    {/* 제품 정보 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* 카테고리 태그 */}
                        {product.category && (
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${ELEMENT_INFO[activeTab]?.bgColor} ${ELEMENT_INFO[activeTab]?.textColor}`}
                          >
                            {product.category}
                          </span>
                        )}

                        {/* 제품명 */}
                        <h4 className="font-medium text-stone-200 group-hover:text-amber-300 transition-colors">
                          {product.name}
                        </h4>

                        {/* 추천 이유 */}
                        <p
                          className={`text-xs mt-1 ${ELEMENT_INFO[activeTab]?.textColor}`}
                        >
                          ✦ {getProductReason(activeTab)}
                        </p>

                        {/* 설명 */}
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                          {product.description}
                        </p>
                      </div>

                      {/* 가격 및 링크 */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-amber-400 font-bold text-lg">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-stone-600 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                          자세히 보기
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* 네비게이션 버튼 및 페이지 인디케이터 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  {/* 이전 버튼 */}
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage === 0
                        ? "opacity-50 cursor-not-allowed text-stone-600"
                        : `bg-gradient-to-r ${ELEMENT_INFO[activeTab]?.color} text-white shadow-lg hover:shadow-xl hover:scale-105`
                    }`}
                    aria-label="이전 페이지"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* 페이지 인디케이터 */}
                  <span className="text-stone-400 text-sm">
                    {currentPage + 1} / {totalPages}
                  </span>

                  {/* 다음 버튼 */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage >= totalPages - 1
                        ? "opacity-50 cursor-not-allowed text-stone-600"
                        : `bg-gradient-to-r ${ELEMENT_INFO[activeTab]?.color} text-white shadow-lg hover:shadow-xl hover:scale-105`
                    }`}
                    aria-label="다음 페이지"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">
              <p>아직 등록된 추천 제품이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 쿠팡 파트너스 문구 */}
      <p className="text-xs text-stone-600 mt-6 text-center">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를
        제공받습니다.
      </p>
    </div>
  );
};

export default ProductRecommendation;
