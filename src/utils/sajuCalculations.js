import {
  CHEONGAN,
  JIJI,
  CHEONGAN_ELEMENT,
  JIJI_ELEMENT,
} from "../data/constants.js";
import { ELEMENT_INFO } from "../data/elementInfo.js";
import { AGE_GROUP_CONFIG } from "../data/ageGroups.js";

// 나이 계산 및 구간 결정 함수
export const calculateAge = (birthYear) => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

export const getAgeGroup = (age) => {
  for (const [key, config] of Object.entries(AGE_GROUP_CONFIG)) {
    if (age >= config.range[0] && age <= config.range[1]) {
      return { key, ...config };
    }
  }
  return { key: "senior", ...AGE_GROUP_CONFIG.senior };
};

// 년주 계산 (입춘 기준 간략화 - 양력 2월 4일 기준)
export const getYearGanJi = (year, month, day, timeJi = null) => {
  // 입춘(대략 2월 4일) 이전이면 전년도로 계산
  let adjustedYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    adjustedYear = year - 1;
  }
  const gan = CHEONGAN[(adjustedYear - 4) % 10];
  const ji = JIJI[(adjustedYear - 4) % 12];

  return { gan, ji };
};

// 월주 계산 (절기 기준 간략화)
// 절기 기준 월 시작일 (대략적)
const MONTH_START_DAYS = [
  { month: 1, startMonth: 2, startDay: 4 }, // 인월(寅月) - 입춘
  { month: 2, startMonth: 3, startDay: 6 }, // 묘월(卯月) - 경칩
  { month: 3, startMonth: 4, startDay: 5 }, // 진월(辰月) - 청명
  { month: 4, startMonth: 5, startDay: 6 }, // 사월(巳月) - 입하
  { month: 5, startMonth: 6, startDay: 6 }, // 오월(午月) - 망종
  { month: 6, startMonth: 7, startDay: 7 }, // 미월(未月) - 소서
  { month: 7, startMonth: 8, startDay: 8 }, // 신월(申月) - 입추
  { month: 8, startMonth: 9, startDay: 8 }, // 유월(酉月) - 백로
  { month: 9, startMonth: 10, startDay: 8 }, // 술월(戌月) - 한로
  { month: 10, startMonth: 11, startDay: 7 }, // 해월(亥月) - 입동
  { month: 11, startMonth: 12, startDay: 7 }, // 자월(子月) - 대설
  { month: 12, startMonth: 1, startDay: 6 }, // 축월(丑月) - 소한
];

export const getMonthGanJi = (year, month, day, timeJi = null) => {
  // 절기 기준으로 음력 월 결정
  let lunarMonth = 12; // 기본값 축월

  for (let i = 0; i < MONTH_START_DAYS.length; i++) {
    const current = MONTH_START_DAYS[i];
    const next = MONTH_START_DAYS[(i + 1) % 12];

    if (current.startMonth === month && day >= current.startDay) {
      lunarMonth = current.month;
      break;
    } else if (current.startMonth === month && day < current.startDay) {
      lunarMonth = ((current.month - 2 + 12) % 12) + 1;
      break;
    }
  }

  // 더 간단한 방식으로 재계산 (절기 기준)
  if (month === 1 && day < 6) lunarMonth = 11; // 소한(1/6) 이전 = 자월
  else if (month === 1 || (month === 2 && day < 4)) lunarMonth = 12; // 소한~입춘 = 축월
  else if (month === 2 || (month === 3 && day < 6)) lunarMonth = 1;
  else if (month === 3 || (month === 4 && day < 5)) lunarMonth = 2;
  else if (month === 4 || (month === 5 && day < 6)) lunarMonth = 3;
  else if (month === 5 || (month === 6 && day < 6)) lunarMonth = 4;
  else if (month === 6 || (month === 7 && day < 7)) lunarMonth = 5;
  else if (month === 7 || (month === 8 && day < 8)) lunarMonth = 6;
  else if (month === 8 || (month === 9 && day < 8)) lunarMonth = 7;
  else if (month === 9 || (month === 10 && day < 8)) lunarMonth = 8;
  else if (month === 10 || (month === 11 && day < 7)) lunarMonth = 9;
  else if (month === 11 || (month === 12 && day < 7)) lunarMonth = 10;
  else if (month === 12) lunarMonth = 11;

  // 년간에 따른 월간 계산 (연상기월법)
  const { gan: yearGan } = getYearGanJi(year, month, day, timeJi);
  const yearGanIndex = CHEONGAN.indexOf(yearGan);

  // 갑/기년 → 병인월 시작, 을/경년 → 무인월 시작, 병/신년 → 경인월 시작, 정/임년 → 임인월 시작, 무/계년 → 갑인월 시작
  const monthGanStart = [2, 4, 6, 8, 0]; // 병(2), 무(4), 경(6), 임(8), 갑(0)
  const baseGanIndex = monthGanStart[yearGanIndex % 5];
  const monthGanIndex = (baseGanIndex + lunarMonth - 1) % 10;

  // 월지: 인(1월), 묘(2월), ... 축(12월)
  // lunarMonth 1 -> 인(2), lunarMonth 2 -> 묘(3), ..., lunarMonth 6 -> 미(7)
  const monthJiIndex = (lunarMonth + 1) % 12;

  return {
    gan: CHEONGAN[monthGanIndex],
    ji: JIJI[monthJiIndex],
  };
};

// 일주 계산 (정확한 기준점 사용)
// 기준: 1900년 1월 1일 = 을해일(乙亥日) - 천간 1(을), 지지 11(해)
export const getDayGanJi = (year, month, day, timeJi = null) => {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

  // 1900년 1월 1일 = 을해일, 을=1, 해=11
  const ganIndex = ((diffDays + 1) % 10 + 10) % 10;
  const jiIndex = ((diffDays + 11) % 12 + 12) % 12;

  return { gan: CHEONGAN[ganIndex], ji: JIJI[jiIndex] };
};

// 시주 계산 (일간 기준 시간 천간 결정)
export const getTimeGanJi = (dayGan, timeJi, year, month, day) => {
  if (!timeJi) return { gan: "?", ji: "?" };

  const dayGanIndex = CHEONGAN.indexOf(dayGan);
  // 갑/기일 → 갑자시 시작, 을/경일 → 병자시 시작, 병/신일 → 무자시 시작, 정/임일 → 경자시 시작, 무/계일 → 임자시 시작
  const timeGanStart = [0, 2, 4, 6, 8]; // 갑(0), 병(2), 무(4), 경(6), 임(8)
  const baseTimeGan = timeGanStart[dayGanIndex % 5];

  const timeJiIndex = JIJI.indexOf(timeJi);
  const timeGanIndex = (baseTimeGan + timeJiIndex) % 10;

  return { gan: CHEONGAN[timeGanIndex], ji: timeJi };
};

// 오행 분석
export const analyzeElements = (saju) => {
  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  [saju.year, saju.month, saju.day, saju.time].forEach((pillar) => {
    if (pillar.gan !== "?") counts[CHEONGAN_ELEMENT[pillar.gan]]++;
    if (pillar.ji !== "?") counts[JIJI_ELEMENT[pillar.ji]]++;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    ...ELEMENT_INFO[name],
  }));
};

// 대운 계산
export const calculateDaeun = (saju, gender, birthYear) => {
  const daeunList = [];
  const startAge = 4 + (birthYear % 3);

  for (let i = 0; i < 8; i++) {
    const age = startAge + i * 10;
    const ganIndex =
      (CHEONGAN.indexOf(saju.month.gan) +
        (gender === "남" ? i + 1 : -i - 1) +
        100) %
      10;
    const jiIndex =
      (JIJI.indexOf(saju.month.ji) + (gender === "남" ? i + 1 : -i - 1) + 120) %
      12;

    daeunList.push({
      age: `${age}-${age + 9}세`,
      gan: CHEONGAN[ganIndex],
      ji: JIJI[jiIndex],
      element: CHEONGAN_ELEMENT[CHEONGAN[ganIndex]],
    });
  }

  return daeunList;
};

// 년운 계산 (단순 년도 기준 - 입춘 무관)
export const calculateYearlyFortune = (saju, year) => {
  const gan = CHEONGAN[(year - 4) % 10];
  const ji = JIJI[(year - 4) % 12];
  const element = CHEONGAN_ELEMENT[gan];
  return { year, gan, ji, element };
};

