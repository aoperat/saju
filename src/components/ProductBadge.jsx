/**
 * 상품 배지 컴포넌트
 * 인기, 신상품, 추천 등의 배지 표시
 */
const ProductBadge = ({ product, element }) => {
  const badges = [];

  // 인기 상품 배지
  if (product.popularity_score && product.popularity_score >= 80) {
    badges.push({
      key: "popular",
      text: "인기",
      className: "bg-rose-500/80 text-white",
    });
  }

  // 리뷰 많은 상품 배지
  if (product.review_count && product.review_count >= 100) {
    badges.push({
      key: "reviews",
      text: `리뷰 ${product.review_count}+`,
      className: "bg-amber-500/80 text-white",
    });
  }

  // 신상품 배지 (30일 이내)
  if (product.created_at) {
    const createdDate = new Date(product.created_at);
    const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 30) {
      badges.push({
        key: "new",
        text: "NEW",
        className: "bg-emerald-500/80 text-white",
      });
    }
  }

  // 할인 상품 배지
  if (product.original_price && product.price < product.original_price) {
    const discountRate = Math.round(
      ((product.original_price - product.price) / product.original_price) * 100
    );
    if (discountRate >= 10) {
      badges.push({
        key: "sale",
        text: `${discountRate}%`,
        className: "bg-red-600 text-white",
      });
    }
  }

  // 배지가 없으면 렌더링하지 않음
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
};

export default ProductBadge;
