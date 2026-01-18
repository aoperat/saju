import { useState, useEffect } from "react";
import { ELEMENT_INFO } from "../data/elementInfo.js";
import { previewBalanceChange } from "../utils/recommendationEngine.js";

/**
 * 오행 밸런스 변화 미리보기 컴포넌트
 * 선택한 상품의 오행이 적용되면 어떻게 밸런스가 변하는지 시각화
 */
const ElementBalancePreview = ({
  currentElements,
  selectedElement = null,
  showAnimation = true,
}) => {
  const [animatedElements, setAnimatedElements] = useState(currentElements);
  const [isAnimating, setIsAnimating] = useState(false);

  // 선택된 오행이 변경되면 미리보기 애니메이션
  useEffect(() => {
    if (selectedElement && showAnimation) {
      setIsAnimating(true);

      // 변화 후 상태 계산
      const newBalance = previewBalanceChange(currentElements, selectedElement, 5);

      // 애니메이션 적용
      const timer = setTimeout(() => {
        setAnimatedElements(newBalance);
      }, 100);

      // 애니메이션 종료
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => {
        clearTimeout(timer);
        clearTimeout(endTimer);
      };
    } else {
      setAnimatedElements(currentElements);
    }
  }, [selectedElement, currentElements, showAnimation]);

  const elements = ["목", "화", "토", "금", "수"];
  const maxPercentage = Math.max(...Object.values(animatedElements), 30);

  return (
    <div className="p-4 bg-stone-800/50 rounded-xl border border-stone-700/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-stone-300">
          오행 밸런스 {selectedElement && "미리보기"}
        </h4>
        {selectedElement && (
          <span className={`text-xs px-2 py-1 rounded ${ELEMENT_INFO[selectedElement]?.bgColor} ${ELEMENT_INFO[selectedElement]?.textColor}`}>
            {ELEMENT_INFO[selectedElement]?.hanja} +5%
          </span>
        )}
      </div>

      <div className="space-y-2">
        {elements.map((el) => {
          const currentValue = currentElements[el] || 0;
          const newValue = animatedElements[el] || 0;
          const info = ELEMENT_INFO[el];
          const isIncreased = selectedElement === el;
          const diff = newValue - currentValue;

          return (
            <div key={el} className="flex items-center gap-2">
              {/* 오행 아이콘 */}
              <span className={`w-6 text-center ${info.textColor}`}>
                {info.hanja}
              </span>

              {/* 프로그레스 바 */}
              <div className="flex-1 h-4 bg-stone-700 rounded-full overflow-hidden relative">
                {/* 현재 값 (배경) */}
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${info.color} opacity-30 transition-all duration-500`}
                  style={{ width: `${(currentValue / maxPercentage) * 100}%` }}
                />

                {/* 새 값 (전경) */}
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${info.color} transition-all duration-500 ${
                    isAnimating && isIncreased ? "animate-pulse" : ""
                  }`}
                  style={{ width: `${(newValue / maxPercentage) * 100}%` }}
                />

                {/* 증가 표시 */}
                {isIncreased && diff > 0 && (
                  <div
                    className="absolute inset-y-0 bg-white/20 transition-all duration-500"
                    style={{
                      left: `${(currentValue / maxPercentage) * 100}%`,
                      width: `${(diff / maxPercentage) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* 퍼센트 값 */}
              <span className={`w-14 text-right text-xs ${
                isIncreased ? info.textColor + " font-bold" : "text-stone-400"
              }`}>
                {Math.round(newValue)}%
                {isIncreased && diff > 0 && (
                  <span className="text-emerald-400 ml-1">↑</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* 균형 상태 표시 */}
      {selectedElement && (
        <div className="mt-3 pt-3 border-t border-stone-700">
          <p className="text-xs text-stone-400 text-center">
            <span className={ELEMENT_INFO[selectedElement]?.textColor}>
              {ELEMENT_INFO[selectedElement]?.hanja}({selectedElement})
            </span>
            {" "}기운이 보완되면 더 균형 잡힌 오행이 됩니다
          </p>
        </div>
      )}
    </div>
  );
};

export default ElementBalancePreview;
