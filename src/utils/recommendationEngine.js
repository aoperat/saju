/**
 * 추천 엔진 - 오행 기반 상품 추천 알고리즘
 */

// 오행 상생 관계 (A -> B: A가 B를 생함)
export const SANGSAENG = {
  목: '화',  // 목생화
  화: '토',  // 화생토
  토: '금',  // 토생금
  금: '수',  // 금생수
  수: '목',  // 수생목
};

// 오행 상극 관계 (A -> B: A가 B를 극함)
export const SANGGEUK = {
  목: '토',  // 목극토
  토: '수',  // 토극수
  수: '화',  // 수극화
  화: '금',  // 화극금
  금: '목',  // 금극목
};

// 계절별 오행
export const SEASON_ELEMENT = {
  spring: '목',      // 봄 (2-4월)
  summer: '화',      // 여름 (5-7월)
  lateSummer: '토',  // 늦여름/환절기
  autumn: '금',      // 가을 (8-10월)
  winter: '수',      // 겨울 (11-1월)
};

// 계절 한글명
export const SEASON_NAME = {
  spring: '봄',
  summer: '여름',
  lateSummer: '환절기',
  autumn: '가을',
  winter: '겨울',
};

/**
 * 현재 계절 판단
 * @returns {string} 계절 키 (spring, summer, autumn, winter)
 */
export const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

/**
 * 상생 오행 찾기 (부족한 오행을 생하는 오행)
 * @param {string} element - 대상 오행
 * @returns {string} 생하는 오행
 */
export const findGeneratingElement = (element) => {
  const reverse = {
    화: '목',  // 목이 화를 생함
    토: '화',  // 화가 토를 생함
    금: '토',  // 토가 금을 생함
    수: '금',  // 금이 수를 생함
    목: '수',  // 수가 목을 생함
  };
  return reverse[element];
};

/**
 * 추천 점수 계산
 * @param {Object} params
 * @param {Array} params.weakElements - 부족한 오행 배열 [{name, percentage}, ...]
 * @param {string} params.currentSeason - 현재 계절
 * @param {Object} params.currentDaeun - 현재 대운 정보 (optional)
 * @param {Object} params.birthElements - 사주 원국 오행 분포 (optional)
 * @returns {Array} 점수순 정렬된 오행 추천 배열
 */
export const calculateRecommendationScore = ({
  weakElements,
  currentSeason = null,
  currentDaeun = null,
  birthElements = null,
}) => {
  const season = currentSeason || getCurrentSeason();

  return weakElements.map((el) => {
    // 기본 부족 점수: 15% 이하일수록 높은 점수 (최대 40점)
    const deficiencyScore = Math.max(0, (15 - el.percentage) * 2.5);

    // 계절 보너스: 현재 계절에 필요한 오행이면 추가 점수
    const seasonBonus = SEASON_ELEMENT[season] === el.name ? 15 : 0;

    // 대운 보너스: 현재 대운에서 필요한 오행이면 추가 점수
    const daeunBonus = currentDaeun?.element === el.name ? 20 : 0;

    // 상생 보너스: 부족한 오행을 생하는 오행도 함께 고려
    const generatingElement = findGeneratingElement(el.name);
    const sangsaengBonus = 5; // 상생 관계 기본 보너스

    const total = deficiencyScore + seasonBonus + daeunBonus + sangsaengBonus;

    return {
      element: el,
      total: Math.round(total * 10) / 10,
      breakdown: {
        deficiencyScore: Math.round(deficiencyScore * 10) / 10,
        seasonBonus,
        daeunBonus,
        sangsaengBonus,
      },
      seasonName: SEASON_NAME[season],
      generatingElement,
    };
  }).sort((a, b) => b.total - a.total);
};

/**
 * 추천 이유 메시지 생성
 * @param {Object} scoreData - calculateRecommendationScore에서 반환된 개별 항목
 * @returns {Object} 추천 이유 객체
 */
export const getRecommendationReason = (scoreData) => {
  const { element, breakdown, seasonName, generatingElement } = scoreData;
  const reasons = [];

  // 주요 이유
  const deficiency = Math.round(15 - element.percentage);
  if (deficiency > 0) {
    reasons.push(`${element.name} 기운이 ${deficiency}% 부족`);
  }

  // 계절 이유
  if (breakdown.seasonBonus > 0) {
    reasons.push(`${seasonName}철에 특히 필요한 기운`);
  }

  // 대운 이유
  if (breakdown.daeunBonus > 0) {
    reasons.push(`현재 대운에서 보완이 필요한 오행`);
  }

  return {
    primary: reasons[0] || `${element.name} 기운 보완 추천`,
    secondary: reasons.slice(1),
    generatingElement,
    totalScore: scoreData.total,
  };
};

/**
 * 오행 밸런스 변화 미리보기
 * @param {Object} currentElements - 현재 오행 분포 {목: 20, 화: 15, ...}
 * @param {string} addElement - 추가될 오행
 * @param {number} addAmount - 추가량 (기본 5%)
 * @returns {Object} 변화 후 오행 분포
 */
export const previewBalanceChange = (currentElements, addElement, addAmount = 5) => {
  const updated = { ...currentElements };
  const elements = Object.keys(updated);

  // 선택한 오행 증가
  updated[addElement] = Math.min(100, (updated[addElement] || 0) + addAmount);

  // 나머지 오행 비례 감소 (총합 100% 유지)
  const total = Object.values(updated).reduce((sum, v) => sum + v, 0);
  if (total > 100) {
    const excess = total - 100;
    const otherElements = elements.filter(e => e !== addElement);
    const otherTotal = otherElements.reduce((sum, e) => sum + updated[e], 0);

    otherElements.forEach(e => {
      const ratio = updated[e] / otherTotal;
      updated[e] = Math.max(0, updated[e] - excess * ratio);
    });
  }

  // 반올림 정리
  elements.forEach(e => {
    updated[e] = Math.round(updated[e] * 10) / 10;
  });

  return updated;
};
