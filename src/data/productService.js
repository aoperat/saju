import { supabase, isSupabaseConfigured } from "../utils/supabase.js";

// 목(木) 상품 JSON 파일 import
import 비취팔찌 from "./상품/목/비취 팔찌.json";
import 벽조목키링 from "./상품/목/벽조목 키링.json";
import 초록색지갑 from "./상품/목/초록색 지갑.json";
import 우드폰케이스 from "./상품/목/우드 폰케이스.json";

// 화(火) 상품 JSON 파일 import
import 로즈골드반지 from "./상품/화/로즈골드 반지.json";
import 자수정목걸이 from "./상품/화/자수정 목걸이.json";
import 레드지갑 from "./상품/화/레드 지갑.json";

// 토(土) 상품 JSON 파일 import
import 호안석팔찌 from "./상품/토/호안석 팔찌.json";
import 황수정목걸이 from "./상품/토/황수정 목걸이.json";

// 금(金) 상품 JSON 파일 import
import 메탈손목시계 from "./상품/금/메탈 손목시계.json";
import 써지컬스틸팔찌 from "./상품/금/써지컬스틸 팔찌.json";

// 수(水) 상품 JSON 파일 import
import 블랙카드지갑 from "./상품/수/블랙 카드지갑.json";
import 진주귀걸이 from "./상품/수/진주 귀걸이.json";
import 블랙크리스탈 from "./상품/수/지혜와 평온을 주는 블랙 & 크리스탈.json";

// JSON 파일들에서 상품 데이터 병합
const mergeProducts = (element, ...jsonFiles) => {
  const products = [];
  for (const json of jsonFiles) {
    if (json[element]) {
      products.push(...json[element]);
    }
  }
  return products;
};

// 실제 상품 데이터
const PRODUCTS = {
  목: mergeProducts("목", 비취팔찌, 벽조목키링, 초록색지갑, 우드폰케이스),
  화: mergeProducts("화", 로즈골드반지, 자수정목걸이, 레드지갑),
  토: mergeProducts("토", 호안석팔찌, 황수정목걸이),
  금: mergeProducts("금", 메탈손목시계, 써지컬스틸팔찌),
  수: mergeProducts("수", 블랙카드지갑, 진주귀걸이, 블랙크리스탈),
};

/**
 * 특정 오행의 제품 목록 조회
 * @param {string} element - 오행 (목, 화, 토, 금, 수)
 * @returns {Promise<Array>} 제품 목록
 */
export const getProductsByElement = async (element) => {
  // Supabase가 설정되지 않았으면 로컬 JSON 데이터 반환
  if (!isSupabaseConfigured()) {
    return PRODUCTS[element] || [];
  }

  try {
    const { data, error } = await supabase
      .from("saju_products")
      .select("*")
      .eq("element", element)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("제품 조회 실패:", error);
    // 에러 시 로컬 JSON 데이터 반환
    return PRODUCTS[element] || [];
  }
};

/**
 * 여러 오행의 제품 목록 조회
 * @param {Array<string>} elements - 오행 배열 (예: ["목", "화"])
 * @returns {Promise<Object>} 오행별 제품 목록
 */
export const getProductsByElements = async (elements) => {
  const result = {};

  for (const element of elements) {
    result[element] = await getProductsByElement(element);
  }

  return result;
};

/**
 * 부족한 오행에 대한 추천 제품 조회
 * @param {Array<Object>} weakElements - 부족한 오행 배열 (예: [{ name: "목" }, { name: "화" }])
 * @returns {Promise<Object>} 오행별 추천 제품
 */
export const getRecommendedProducts = async (weakElements) => {
  const elementNames = weakElements.map((e) => e.name);
  return await getProductsByElements(elementNames);
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
