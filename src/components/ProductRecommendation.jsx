import { useState, useEffect, useRef, useMemo } from "react";
import {
  getWeightedProducts,
  ELEMENT_RECOMMENDATION_MESSAGE,
  ELEMENT_COLORS,
  getDetailedReason,
} from "../data/productService.js";
import { ELEMENT_INFO } from "../data/elementInfo.js";
import { PRICE_RANGES, getPriceFilter, DEFAULT_FILTERS } from "../data/productCategories.js";
import { calculateRecommendationScore, getCurrentSeason, SEASON_NAME } from "../utils/recommendationEngine.js";
import { useWishlist } from "../hooks/useWishlist.js";
import ProductBadge from "./ProductBadge.jsx";
import ElementBalancePreview from "./ElementBalancePreview.jsx";

const ProductRecommendation = ({ weakElements, elementPercentages = {} }) => {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showBalancePreview, setShowBalancePreview] = useState(false);
  const [rankedElements, setRankedElements] = useState([]);
  const swiperRef = useRef(null);
  const swiperInstanceRef = useRef(null);
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();

  // 추천 점수 계산
  const scoredElements = useMemo(() => {
    if (!weakElements || weakElements.length === 0) return [];
    return calculateRecommendationScore({
      weakElements,
      currentSeason: getCurrentSeason(),
    });
  }, [weakElements]);

  // 상품 데이터 불러오기
  useEffect(() => {
    const fetchProducts = async () => {
      if (!scoredElements || scoredElements.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setRankedElements(scoredElements);

      const priceFilter = getPriceFilter(filters.priceRange);
      const weightedProducts = await getWeightedProducts(scoredElements, {
        ...priceFilter,
        purpose: filters.purpose,
        gender: filters.gender,
      });

      setProducts(weightedProducts);
      setActiveTab(scoredElements[0]?.element?.name || null);
      setLoading(false);
    };

    fetchProducts();
  }, [scoredElements, filters]);

  // Swiper 초기화
  useEffect(() => {
    if (swiperRef.current && window.Swiper && products[activeTab]?.products?.length > 0) {
      // 기존 인스턴스 제거
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
      }

      // 새 Swiper 인스턴스 생성
      swiperInstanceRef.current = new window.Swiper(swiperRef.current, {
        slidesPerView: 1,
        spaceBetween: 12,
        grid: {
          rows: 2,
          fill: "row",
        },
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        pagination: {
          el: ".swiper-pagination",
          type: "fraction",
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      });
    }

    return () => {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
    };
  }, [activeTab, products]);

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

  const currentProductData = products[activeTab] || { products: [], score: 0, reason: {} };
  const currentProducts = currentProductData.products || [];
  const currentSeason = getCurrentSeason();
  const seasonName = SEASON_NAME[currentSeason];

  // 현재 선택된 오행의 상세 추천 이유
  const detailedReason = activeTab
    ? getDetailedReason(
        activeTab,
        currentProductData.percentage || 0,
        currentProductData.reason || {}
      )
    : null;

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-stone-900/80 to-stone-800/50 rounded-2xl border border-amber-900/30">
      <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
        <span className="text-2xl">物</span>
        부족한 기운 보완 아이템
      </h3>

      <p className="text-sm text-stone-400 mb-4">
        부족한 오행의 기운을 보완해주는 아이템을 곁에 두면 좋습니다.
      </p>


      {/* 오행 탭 (점수순 정렬) */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {rankedElements.map((item, index) => {
          const element = item.element;
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
              {index === 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  추천
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 오행의 상세 정보 */}
      {activeTab && (
        <div>
          {/* 추천 이유 상세 표시 */}
          {detailedReason && (
            <div className="mb-4 p-3 bg-stone-800/50 rounded-xl border border-stone-700/50">
              <div className="flex items-start gap-3">
                <span className={`text-2xl ${ELEMENT_INFO[activeTab]?.textColor}`}>
                  {ELEMENT_INFO[activeTab]?.hanja}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-stone-200 font-medium">
                    {detailedReason.primary}
                  </p>
                  {detailedReason.secondary.map((reason, idx) => (
                    <p key={idx} className="text-xs text-stone-400 mt-1">
                      • {reason}
                    </p>
                  ))}
                  <p className={`text-xs mt-2 ${ELEMENT_INFO[activeTab]?.textColor}`}>
                    → {detailedReason.recommendation}
                  </p>
                </div>
                <button
                  onClick={() => setShowBalancePreview(!showBalancePreview)}
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  {showBalancePreview ? "닫기" : "밸런스 미리보기"}
                </button>
              </div>
            </div>
          )}

          {/* 오행 밸런스 미리보기 */}
          {showBalancePreview && Object.keys(elementPercentages).length > 0 && (
            <div className="mb-4">
              <ElementBalancePreview
                currentElements={elementPercentages}
                selectedElement={activeTab}
              />
            </div>
          )}

          <p className="text-sm text-stone-300 mb-4">
            <span className={ELEMENT_INFO[activeTab]?.textColor}>
              {ELEMENT_INFO[activeTab]?.hanja}({activeTab})
            </span>
            의 기운 -{" "}
            <span className="text-stone-400">
              {ELEMENT_RECOMMENDATION_MESSAGE[activeTab]} 아이템
            </span>
          </p>

          {/* Swiper 캐러셀 */}
          {currentProducts.length > 0 ? (
            <div className="relative">
              <div ref={swiperRef} className="swiper">
                <div className="swiper-wrapper">
                  {currentProducts.map((product) => (
                    <div key={product.id} className="swiper-slide">
                      <div className="group p-4 bg-stone-800/50 rounded-xl border border-stone-700/50 hover:border-amber-600/50 hover:bg-stone-800 transition-all">
                        {/* 상품 상단: 배지 & 찜하기 */}
                        <div className="flex items-start justify-between mb-3">
                          <ProductBadge product={product} element={activeTab} />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              isWishlisted(product.id)
                                ? "text-rose-500 bg-rose-500/10"
                                : "text-stone-500 hover:text-rose-400 hover:bg-stone-700"
                            }`}
                            aria-label={isWishlisted(product.id) ? "찜 해제" : "찜하기"}
                          >
                            <svg
                              className="w-5 h-5"
                              fill={isWishlisted(product.id) ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* 상품 콘텐츠 */}
                        <a
                          href={product.coupang_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-4"
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
                              <h4 className="font-medium text-stone-200 group-hover:text-amber-300 transition-colors line-clamp-2">
                                {product.name}
                              </h4>

                              {/* 설명 */}
                              <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                                {product.description}
                              </p>
                            </div>

                            {/* 가격 및 링크 */}
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                {product.original_price && product.original_price > product.price && (
                                  <span className="text-xs text-stone-500 line-through mr-2">
                                    {formatPrice(product.original_price)}
                                  </span>
                                )}
                                <span className="text-amber-400 font-bold text-lg">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
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
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* 하단 네비게이션 영역 */}
              {currentProducts.length > 1 && (
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-stone-800/50">
                  <button
                    className="swiper-button-prev !static !w-8 !h-8 !mt-0 after:!hidden text-stone-500 hover:text-amber-400 transition-colors"
                    aria-label="Previous slide"
                    onClick={() => swiperInstanceRef.current?.slidePrev()}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="swiper-pagination !static !w-auto text-amber-500/80 text-sm font-medium"></div>
                  <button
                    className="swiper-button-next !static !w-8 !h-8 !mt-0 after:!hidden text-stone-500 hover:text-amber-400 transition-colors"
                    aria-label="Next slide"
                    onClick={() => swiperInstanceRef.current?.slideNext()}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">
              <p>해당 조건에 맞는 추천 제품이 없습니다.</p>
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
