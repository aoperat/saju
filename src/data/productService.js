import { supabase, isSupabaseConfigured } from "../utils/supabase.js";
import { ELEMENT_INFO } from "./elementInfo.js";

/**
 * 특정 오행의 제품 목록 조회
 * @param {string} element - 오행 (목, 화, 토, 금, 수)
 * @param {Object} filters - 필터 옵션 {minPrice, maxPrice, gender, purpose}
 * @returns {Promise<Array>} 제품 목록
 */
export const getProductsByElement = async (element, filters = {}) => {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase가 설정되지 않았습니다.");
    return [];
  }

  try {
    let query = supabase
      .from("saju_products")
      .select("*")
      .eq("element", element);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("제품 조회 실패:", error);
    return [];
  }
};

/**
 * 여러 오행의 제품 목록 조회
 * @param {Array<string>} elements - 오행 배열 (예: ["목", "화"])
 * @param {Object} filters - 필터 옵션
 * @returns {Promise<Object>} 오행별 제품 목록
 */
export const getProductsByElements = async (elements, filters = {}) => {
  const result = {};

  for (const element of elements) {
    result[element] = await getProductsByElement(element, filters);
  }

  return result;
};

/**
 * 부족한 오행에 대한 추천 제품 조회
 * @param {Array<Object>} weakElements - 부족한 오행 배열 (예: [{ name: "목" }, { name: "화" }])
 * @param {Object} filters - 필터 옵션
 * @returns {Promise<Object>} 오행별 추천 제품
 */
export const getRecommendedProducts = async (weakElements, filters = {}) => {
  const elementNames = weakElements.map((e) => e.name);
  return await getProductsByElements(elementNames, filters);
};

/**
 * 가중치 기반 제품 조회 (추천 점수 포함)
 * @param {Array} rankedElements - calculateRecommendationScore에서 반환된 정렬된 배열
 * @param {Object} filters - 필터 옵션 {minPrice, maxPrice, gender, purpose}
 * @returns {Promise<Object>} 오행별 제품 및 점수 정보
 */
export const getWeightedProducts = async (rankedElements, filters = {}) => {
  const result = {};

  for (const item of rankedElements) {
    const products = await getProductsByElement(item.element.name, filters);

    result[item.element.name] = {
      products,
      score: item.total,
      reason: item.breakdown,
      seasonName: item.seasonName,
      generatingElement: item.generatingElement,
      percentage: item.element.percentage,
    };
  }

  return result;
};

/**
 * 상세 추천 이유 생성
 * @param {string} element - 오행
 * @param {number} percentage - 현재 비율
 * @param {Object} scoreBreakdown - 점수 분석 객체
 * @returns {Object} 상세 추천 이유
 */
export const getDetailedReason = (element, percentage, scoreBreakdown = {}) => {
  const deficiency = Math.round(15 - percentage);
  const colorText = ELEMENT_COLORS[element]?.text || "";
  const elementDesc = ELEMENT_INFO[element]?.desc || "";

  const reasons = [];

  // 주요 이유
  if (deficiency > 0) {
    reasons.push(`${element} 기운이 부족합니다`);
  }

  // 계절 이유
  if (scoreBreakdown.seasonBonus > 0) {
    reasons.push(`현재 계절에 특히 필요한 기운입니다`);
  }

  // 대운 이유
  if (scoreBreakdown.daeunBonus > 0) {
    reasons.push(`현재 대운에서 보완이 필요한 오행입니다`);
  }

  return {
    primary: reasons[0] || `${element} 기운 보완 추천`,
    secondary: reasons.slice(1),
    recommendation: `${colorText} 계열 아이템으로 보완하세요`,
    effect: elementDesc,
    deficiency,
  };
};

// 오행별 추천 메시지
export const ELEMENT_RECOMMENDATION_MESSAGE = {
  목: "성장과 창의력을 높여주는",
  화: "열정과 활력을 불어넣는",
  토: "안정과 균형을 가져다주는",
  금: "결단력과 실행력을 높여주는",
  수: "지혜와 유연성을 높여주는",
};

// 오행별 색상 정보
export const ELEMENT_COLORS = {
  목: { text: "녹색/청색", gradient: "from-emerald-600 to-green-700" },
  화: { text: "빨강/주황", gradient: "from-red-500 to-rose-600" },
  토: { text: "노랑/갈색", gradient: "from-yellow-600 to-amber-700" },
  금: { text: "흰색/은색", gradient: "from-slate-300 to-gray-400" },
  수: { text: "파랑/검정", gradient: "from-blue-600 to-indigo-700" },
};

// 오행별 추천 이유 생성
export const getProductReason = (element) => {
  const colorText = ELEMENT_COLORS[element]?.text || "";
  const messages = {
    목: `목(木)의 성장 기운을 높여주는 ${colorText} 아이템`,
    화: `화(火)의 열정을 불어넣는 ${colorText} 아이템`,
    토: `토(土)의 안정감을 주는 ${colorText} 아이템`,
    금: `금(金)의 결단력을 높여주는 ${colorText} 아이템`,
    수: `수(水)의 지혜를 높여주는 ${colorText} 아이템`,
  };
  return messages[element] || "";
};
