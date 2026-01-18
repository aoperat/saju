import React, { useState, useEffect } from "react";
import { CHEONGAN_ELEMENT, JIJI_ELEMENT, TIME_JIJI } from "./data/constants.js";
import { ELEMENT_INFO } from "./data/elementInfo.js";
import {
  getYearGanJi,
  getMonthGanJi,
  getDayGanJi,
  getTimeGanJi,
  analyzeElements,
  calculateDaeun,
  calculateYearlyFortune,
  calculateAge,
  getAgeGroup,
} from "./utils/sajuCalculations.js";
import { callOpenAI } from "./utils/openai.js";
import { TaegeukSymbol, CloudPattern, PalgwaeSymbol } from "./components/Symbols.jsx";
import ProductRecommendation from "./components/ProductRecommendation.jsx";

// --- 메인 앱 컴포넌트 ---
const App = () => {
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [formData, setFormData] = useState({
    date: "",
    time: "모름",
    gender: "남",
    calendarType: "양력",
  });
  const [analysisResult, setAnalysisResult] = useState(null);

  const loadingSteps = [
    "사주팔자를 계산하고 있습니다",
    "오행의 기운을 살피고 있습니다",
    "대운의 흐름을 읽고 있습니다",
    "천기를 해석하고 있습니다",
    "운명의 길을 밝히고 있습니다",
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) =>
          prev < loadingSteps.length - 1 ? prev + 1 : prev
        );
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleAnalyze = async () => {
    if (!formData.date) {
      alert("생년월일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setLoadingStep(0);

    const [year, month, day] = formData.date.split("-").map(Number);
    const timeJi = TIME_JIJI[formData.time];

    const yearPillar = getYearGanJi(year, month, day, timeJi);
    const monthPillar = getMonthGanJi(year, month, day, timeJi);
    const dayPillar = getDayGanJi(year, month, day, timeJi);
    const timePillar = getTimeGanJi(dayPillar.gan, timeJi, year, month, day);

    const saju = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      time: timePillar,
    };

    const elements = analyzeElements(saju);
    const daeun = calculateDaeun(saju, formData.gender, year);
    const currentYear = new Date().getFullYear();
    const yearlyFortune = [
      calculateYearlyFortune(saju, currentYear),
      calculateYearlyFortune(saju, currentYear + 1),
    ];

    const elementStr = elements
      .map((e) => `${e.name}(${e.count}개, ${e.percentage}%)`)
      .join(", ");
    const sortedElements = [...elements].sort((a, b) => b.count - a.count);
    const strongElement = sortedElements[0];
    const weakElements = sortedElements.filter(
      (e) => e.count === 0 || e.percentage < 15
    );

    const age = calculateAge(year);
    const ageGroup = getAgeGroup(age);
    const ageSpecificPrompts = ageGroup.promptItems.join("\n");

    const prompt = `
사주팔자 정보:
- 년주: ${saju.year.gan}${saju.year.ji}
- 월주: ${saju.month.gan}${saju.month.ji}
- 일주: ${saju.day.gan}${saju.day.ji}
- 시주: ${saju.time.gan}${saju.time.ji}
- 성별: ${formData.gender}
- 생년월일: ${year}년 ${month}월 ${day}일 (${formData.calendarType})
- 나이: 만 ${age}세 (${ageGroup.label})

오행 분포: ${elementStr}
강한 오행: ${strongElement.name}
부족한 오행: ${weakElements.map((e) => e.name).join(", ") || "없음"}

이 분은 현재 "${ageGroup.label}" 시기로, "${ageGroup.description}"입니다.
다음 항목들을 각각 분석해주세요. 각 항목은 "【항목명】" 형식으로 시작하고, 2-3문장으로 작성해주세요.
${age}세의 나이에 맞는 현실적이고 구체적인 조언을 해주세요:

【종합운】 이 사주의 전체적인 특성과 성향 (${ageGroup.label} 시기에 맞게)
【${currentYear}년 운세】 올해의 전반적인 운세
【${currentYear + 1}년 운세】 내년의 전반적인 운세
${ageSpecificPrompts}
【행운의 요소】 행운을 가져다줄 색상, 숫자, 방향, 아이템 등
【${ageGroup.advice}】 ${ageGroup.label} 시기에 맞는 구체적인 조언
【보완 처방】 부족한 오행을 채우기 위한 ${
      ageGroup.label
    }에게 적합한 구체적인 방법
`;

    const aiResponse = await callOpenAI(prompt);

    const parseAIResponse = (response) => {
      if (!response) return {};
      const sections = {};
      const regex = /【([^】]+)】([^【]*)/g;
      let match;
      while ((match = regex.exec(response)) !== null) {
        sections[match[1].trim()] = match[2].trim();
      }
      return sections;
    };

    const parsedAI = parseAIResponse(aiResponse);

    setAnalysisResult({
      saju,
      elements,
      daeun,
      yearlyFortune,
      currentYear,
      aiAnalysis: parsedAI,
      strongElement,
      weakElements,
      birthInfo: { year, month, day, gender: formData.gender, calendarType: formData.calendarType },
      age,
      ageGroup,
    });

    setLoading(false);
    setView("report");
    window.scrollTo(0, 0);
  };

  const timeOptions = [
    { value: "모름", label: "모름" },
    { value: "자시", label: "자시 (23:30~01:29)" },
    { value: "축시", label: "축시 (01:30~03:29)" },
    { value: "인시", label: "인시 (03:30~05:29)" },
    { value: "묘시", label: "묘시 (05:30~07:29)" },
    { value: "진시", label: "진시 (07:30~09:29)" },
    { value: "사시", label: "사시 (09:30~11:29)" },
    { value: "오시", label: "오시 (11:30~13:29)" },
    { value: "미시", label: "미시 (13:30~15:29)" },
    { value: "신시", label: "신시 (15:30~17:29)" },
    { value: "유시", label: "유시 (17:30~19:29)" },
    { value: "술시", label: "술시 (19:30~21:29)" },
    { value: "해시", label: "해시 (21:30~23:29)" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100 font-serif">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 전통 문양 배경 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 text-amber-400">
            <PalgwaeSymbol className="w-full h-full" />
          </div>
          <div className="absolute top-20 right-20 w-32 h-32 text-amber-400">
            <TaegeukSymbol className="w-full h-full" />
          </div>
          <div className="absolute bottom-20 left-20 w-36 h-36 text-amber-400">
            <TaegeukSymbol className="w-full h-full" />
          </div>
          <div className="absolute bottom-10 right-10 w-44 h-44 text-amber-400">
            <PalgwaeSymbol className="w-full h-full" />
          </div>
        </div>
        {/* 그라데이션 오버레이 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-900/10 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-red-900/10 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-lg mx-auto px-5 py-8 min-h-screen">
        {/* VIEW: HOME */}
        {view === "home" && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* 헤더 */}
            <header className="text-center pt-8">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 mx-auto text-amber-500/80">
                  <TaegeukSymbol className="w-full h-full animate-spin-slow" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3 tracking-wider">
                <span className="text-amber-400">四</span>
                <span className="text-amber-300">柱</span>
                <span className="text-amber-400">命</span>
                <span className="text-amber-300">理</span>
              </h1>
              <p className="text-2xl text-stone-300 mb-2">사주명리</p>
              <p className="text-stone-500 text-sm tracking-wide">
                천기를 읽어 운명의 길을 밝히다
              </p>
            </header>

            {/* 입력 폼 */}
            <div className="relative">
              {/* 테두리 장식 */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/50 via-amber-800/30 to-amber-600/50 rounded-2xl"></div>
              <div className="absolute -inset-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent rounded-2xl"></div>

              <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 p-8 rounded-2xl space-y-6">
                {/* 구름 문양 */}
                <div className="absolute top-0 left-0 w-full h-8 text-amber-500/20">
                  <CloudPattern className="w-full h-full" />
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-amber-500/80 tracking-widest">
                      生年月日 (생년월일)
                    </label>
                    <div className="flex bg-stone-800/50 p-1 rounded-lg border border-amber-900/50">
                      {["양력", "음력"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, calendarType: type })
                          }
                          className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                            formData.calendarType === type
                              ? "bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-sm shadow-amber-900/50"
                              : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={formData.date}
                    className="w-full p-4 bg-stone-800/50 border border-amber-900/50 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 focus:outline-none transition-all text-stone-100 placeholder-stone-500"
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-amber-500/80 tracking-widest">
                      生時 (태어난 시간)
                    </label>
                    <select
                      value={formData.time}
                      className="w-full p-4 bg-stone-800/50 border border-amber-900/50 rounded-xl focus:border-amber-500/50 focus:outline-none text-stone-100 appearance-none cursor-pointer"
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    >
                      {timeOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-stone-800"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-amber-500/80 tracking-widest">
                      性別 (성별)
                    </label>
                    <div className="flex bg-stone-800/50 p-1 rounded-xl border border-amber-900/50">
                      {["남", "여"].map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setFormData({ ...formData, gender: g })
                          }
                          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                            formData.gender === g
                              ? "bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-900/50"
                              : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          {g === "남" ? "乾 (남)" : "坤 (여)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 hover:from-amber-700 hover:via-amber-600 hover:to-amber-700 text-amber-100 py-5 rounded-xl font-bold tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-900/50 border border-amber-600/30 flex items-center justify-center gap-3"
                >
                  <span className="text-lg">卜</span>
                  <span>운명 감정 시작</span>
                  <span className="text-lg">占</span>
                </button>

                {/* 하단 구름 문양 */}
                <div className="absolute bottom-0 left-0 w-full h-8 text-amber-500/20 rotate-180">
                  <CloudPattern className="w-full h-full" />
                </div>
              </div>
            </div>

            <p className="text-center text-stone-600 text-xs tracking-wide">
              ※ 본 사주풀이는 참고용이며 재미로 봐주시기 바랍니다
            </p>
          </div>
        )}

        {/* VIEW: LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-screen space-y-8 animate-fade-in">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 text-amber-500/30 animate-spin-slow">
                <PalgwaeSymbol className="w-full h-full" />
              </div>
              <div className="absolute inset-8 text-amber-400/60 animate-spin-reverse">
                <TaegeukSymbol className="w-full h-full" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-xl text-amber-300 tracking-widest">
                {loadingSteps[loadingStep]}
              </p>
              <div className="flex justify-center gap-2">
                {loadingSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= loadingStep ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-stone-500 text-sm">
                잠시만 기다려 주십시오...
              </p>
            </div>
          </div>
        )}

        {/* VIEW: REPORT */}
        {view === "report" && analysisResult && (
          <div className="space-y-6 pb-10 animate-fade-in">
            {/* 사주팔자 표시 */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/40 via-amber-800/20 to-amber-600/40 rounded-2xl"></div>
              <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 p-6 rounded-2xl">
                <h3 className="text-center text-amber-500 text-sm tracking-widest mb-6">
                  四 柱 八 字
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "時柱", sub: "시주", ...analysisResult.saju.time },
                    { label: "日柱", sub: "일주", ...analysisResult.saju.day },
                    {
                      label: "月柱",
                      sub: "월주",
                      ...analysisResult.saju.month,
                    },
                    { label: "年柱", sub: "년주", ...analysisResult.saju.year },
                  ].map((pillar, i) => (
                    <div key={i} className="text-center">
                      <p className="text-base font-medium text-amber-500 mb-1">
                        {pillar.label}
                      </p>
                      <p className="text-xs text-stone-400 mb-2">
                        {pillar.sub}
                      </p>
                      <div className="bg-gradient-to-b from-stone-800 to-stone-900 rounded-xl p-3 border border-amber-900/30 shadow-inner">
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-amber-300">
                            {pillar.gan}
                          </p>
                          {(() => {
                            const element = CHEONGAN_ELEMENT[pillar.gan];
                            const elementInfo = element ? ELEMENT_INFO[element] : null;
                            return (
                              <p className={`text-sm font-medium mt-1 ${elementInfo?.textColor || "text-stone-500"}`}>
                                {element || "?"}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mx-auto my-2"></div>
                        <div>
                          <p className="text-3xl font-bold text-red-400">
                            {pillar.ji}
                          </p>
                          {(() => {
                            const element = JIJI_ELEMENT[pillar.ji];
                            const elementInfo = element ? ELEMENT_INFO[element] : null;
                            return (
                              <p className={`text-sm font-medium mt-1 ${elementInfo?.textColor || "text-stone-500"}`}>
                                {element || "?"}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 나이 및 구간 정보 */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-4 rounded-xl border border-amber-900/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">歲</span>
                  <div>
                    <p className="text-amber-300 font-bold text-lg">
                      만 {analysisResult.age}세
                    </p>
                    <p className="text-stone-400 text-sm">
                      {analysisResult.ageGroup.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-stone-300 text-sm">
                    {analysisResult.ageGroup.description}
                  </p>
                  <p className="text-amber-500/80 text-base">
                    {analysisResult.ageGroup.fortunes.length}개 항목 분석
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-amber-900/30">
                <p className="text-stone-400 text-sm">
                  생년월일: {analysisResult.birthInfo.year}년 {analysisResult.birthInfo.month}월 {analysisResult.birthInfo.day}일 ({analysisResult.birthInfo.calendarType})
                </p>
              </div>
            </div>

            {/* 오행 밸런스 */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/30 via-amber-800/20 to-amber-600/30 rounded-2xl"></div>
              <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 p-6 rounded-2xl">
                <h3 className="text-center text-amber-500 text-sm tracking-widest mb-6">
                  五 行 均 衡
                </h3>
                <div className="space-y-4">
                  {analysisResult.elements.map((el) => (
                    <div key={el.name} className="space-y-2">
                      <div className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-lg ${el.bgColor} flex items-center justify-center text-xl font-bold ${el.textColor}`}
                          >
                            {el.hanja}
                          </span>
                          <span className={`text-base font-medium ${el.textColor}`}>{el.name}</span>
                          <span className={`text-sm hidden sm:inline ${el.textColor}/70`}>
                            ({el.desc})
                          </span>
                        </span>
                        <span className="font-mono text-amber-400 text-base">
                          {el.count}개 ({el.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${el.color} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${Math.max(el.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {analysisResult.weakElements.length > 0 && (
                  <div className="mt-6 p-4 bg-red-950/30 border border-red-900/30 rounded-xl">
                    <p className="text-base text-red-300">
                      ⚠ 부족한 기운:{" "}
                      <strong className="text-red-200">
                        {analysisResult.weakElements
                          .map((e) => `${e.hanja}(${e.name})`)
                          .join(", ")}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 종합운 */}
            {analysisResult.aiAnalysis["종합운"] && (
              <div className="relative">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-600/40 via-amber-500/60 to-amber-600/40 rounded-2xl"></div>
                <div className="relative bg-gradient-to-br from-amber-950 to-stone-950 p-6 rounded-2xl">
                  <h3 className="text-amber-400 text-sm tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-xl">總</span> 종합운세
                  </h3>
                  <p className="text-stone-200 leading-relaxed">
                    {analysisResult.aiAnalysis["종합운"]}
                  </p>
                </div>
              </div>
            )}

            {/* 년운 */}
            <div className="grid grid-cols-2 gap-4">
              {analysisResult.yearlyFortune.map((yf, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-b from-stone-900 to-stone-950 p-5 rounded-xl border border-amber-900/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl text-amber-500">
                      {idx === 0 ? "今" : "來"}
                    </span>
                    <span className="text-stone-300 text-sm">{yf.year}년</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-amber-300">
                      {yf.gan}
                    </span>
                    <span className="text-3xl font-bold text-red-400">
                      {yf.ji}
                    </span>
                    <span
                      className={`ml-2 text-sm px-2.5 py-1 rounded font-medium ${
                        ELEMENT_INFO[yf.element]?.bgColor
                      } ${ELEMENT_INFO[yf.element]?.textColor}`}
                    >
                      {yf.element}
                    </span>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {analysisResult.aiAnalysis[`${yf.year}년 운세`] ||
                      "운세 분석 중..."}
                  </p>
                </div>
              ))}
            </div>

            {/* 나이대별 맞춤 운세 */}
            <div className="space-y-4">
              <h3 className="text-amber-500 text-sm tracking-widest flex items-center gap-2 px-1">
                <span className="text-lg">命</span>{" "}
                {analysisResult.ageGroup.label} 맞춤 운세
              </h3>
              {analysisResult.ageGroup.fortunes.map(
                (item) =>
                  analysisResult.aiAnalysis[item.key] && (
                    <div
                      key={item.key}
                      className={`bg-gradient-to-br ${item.color} p-5 rounded-xl border ${item.borderColor}`}
                    >
                      <h4 className="text-stone-100 text-sm font-medium mb-2 flex items-center gap-2">
                        <span className="text-xl text-amber-400">
                          {item.icon}
                        </span>
                        {item.key}
                      </h4>
                      <p className="text-sm text-stone-300 leading-relaxed">
                        {analysisResult.aiAnalysis[item.key]}
                      </p>
                    </div>
                  )
              )}
            </div>

            {/* 맞춤 조언 */}
            {analysisResult.aiAnalysis[analysisResult.ageGroup.advice] && (
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-950/40 p-6 rounded-xl border border-amber-700/30">
                <h3 className="text-amber-400 text-sm tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-xl">訓</span>{" "}
                  {analysisResult.ageGroup.advice}
                </h3>
                <p className="text-stone-200 leading-relaxed">
                  {analysisResult.aiAnalysis[analysisResult.ageGroup.advice]}
                </p>
              </div>
            )}

            {/* 대운 흐름 */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/30 via-amber-800/20 to-amber-600/30 rounded-2xl"></div>
              <div className="relative bg-gradient-to-b from-stone-900 to-stone-950 p-6 rounded-2xl">
                <h3 className="text-center text-amber-500 text-sm tracking-widest mb-4">
                  大 運 流 年
                </h3>
                <p className="text-center text-stone-500 text-xs mb-4">
                  10년 주기의 운의 흐름
                </p>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                  {analysisResult.daeun.map((d, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 text-center p-3 bg-stone-800/50 rounded-xl border border-amber-900/20 min-w-[75px]"
                    >
                      <p className="text-xs text-stone-400 mb-1">{d.age}</p>
                      <p className="text-xl font-bold">
                        <span className="text-amber-300">{d.gan}</span>
                        <span className="text-red-400">{d.ji}</span>
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          ELEMENT_INFO[d.element]?.bgColor
                        } ${ELEMENT_INFO[d.element]?.textColor}`}
                      >
                        {d.element}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 행운의 요소 */}
            {analysisResult.aiAnalysis["행운의 요소"] && (
              <div className="bg-gradient-to-b from-stone-900 to-stone-950 p-6 rounded-xl border border-amber-900/30">
                <h3 className="text-amber-500 text-sm tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-xl">福</span> 행운의 요소
                </h3>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {analysisResult.aiAnalysis["행운의 요소"]}
                </p>
              </div>
            )}

            {/* 보완 처방 */}
            {analysisResult.aiAnalysis["보완 처방"] && (
              <div className="relative">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-600/40 via-teal-600/40 to-emerald-600/40 rounded-2xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-950 to-stone-950 p-6 rounded-2xl">
                  <h3 className="text-emerald-400 text-sm tracking-widest mb-3 flex items-center gap-2">
                    <span className="text-xl">方</span> 보완 처방
                  </h3>
                  <p className="text-stone-200 leading-relaxed">
                    {analysisResult.aiAnalysis["보완 처방"]}
                  </p>
                </div>
              </div>
            )}

            {/* 부족한 오행 제품 추천 */}
            <ProductRecommendation
              weakElements={analysisResult.weakElements}
              elementPercentages={
                analysisResult.elements.reduce((acc, el) => {
                  acc[el.name] = el.percentage;
                  return acc;
                }, {})
              }
            />

            {/* 다시 분석 버튼 */}
            <button
              onClick={() => {
                setView("home");
                setFormData({ date: "", time: "모름", gender: "남", calendarType: "양력" });
                setAnalysisResult(null);
              }}
              className="w-full py-4 text-sm text-stone-500 hover:text-amber-400 transition-colors tracking-widest"
            >
              ← 다시 감정하기
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
        }
      `}</style>
    </div>
  );
};

export default App;

