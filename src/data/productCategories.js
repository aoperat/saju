/**
 * 상품 필터 카테고리 상수
 */

// 가격대 필터
export const PRICE_RANGES = {
  all: { min: 0, max: null, label: '전체' },
  budget: { min: 0, max: 30000, label: '3만원 이하' },
  mid: { min: 30000, max: 100000, label: '3-10만원' },
  premium: { min: 100000, max: null, label: '10만원 이상' },
};

// 용도 필터
export const PURPOSE_TYPES = {
  all: { label: '전체', value: 'all' },
  self: { label: '본인용', value: 'self' },
  gift: { label: '선물용', value: 'gift' },
};

// 성별 필터
export const GENDER_TYPES = {
  all: { label: '전체', value: '공용' },
  male: { label: '남성용', value: '남' },
  female: { label: '여성용', value: '여' },
};

// 정렬 옵션
export const SORT_OPTIONS = {
  recommended: { label: '추천순', value: 'recommended' },
  popular: { label: '인기순', value: 'popular' },
  priceLow: { label: '낮은 가격순', value: 'price_asc' },
  priceHigh: { label: '높은 가격순', value: 'price_desc' },
  newest: { label: '최신순', value: 'newest' },
};

// 기본 필터 상태
export const DEFAULT_FILTERS = {
  priceRange: 'all',
  purpose: 'all',
  gender: 'all',
  sort: 'recommended',
};

/**
 * 가격대 필터 값 반환
 * @param {string} rangeKey - 가격대 키
 * @returns {Object} {minPrice, maxPrice}
 */
export const getPriceFilter = (rangeKey) => {
  const range = PRICE_RANGES[rangeKey] || PRICE_RANGES.all;
  return {
    minPrice: range.min || null,
    maxPrice: range.max || null,
  };
};
