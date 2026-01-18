-- 상품 메타데이터 추가 마이그레이션
-- 성별, 용도, 인기도, 리뷰 수 컬럼 추가

-- 성별 타겟 컬럼 추가
ALTER TABLE saju_products
  ADD COLUMN IF NOT EXISTS target_gender TEXT CHECK (target_gender IN ('남', '여', '공용')) DEFAULT '공용';

-- 용도 컬럼 추가 (self: 본인용, gift: 선물용, both: 둘 다)
ALTER TABLE saju_products
  ADD COLUMN IF NOT EXISTS purpose TEXT CHECK (purpose IN ('self', 'gift', 'both')) DEFAULT 'both';

-- 인기도 점수 컬럼 추가 (0-100)
ALTER TABLE saju_products
  ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100);

-- 리뷰 수 컬럼 추가
ALTER TABLE saju_products
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- 원래 가격 컬럼 추가 (할인 표시용)
ALTER TABLE saju_products
  ADD COLUMN IF NOT EXISTS original_price INTEGER CHECK (original_price > 0);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_saju_products_gender ON saju_products(target_gender);
CREATE INDEX IF NOT EXISTS idx_saju_products_purpose ON saju_products(purpose);
CREATE INDEX IF NOT EXISTS idx_saju_products_popularity ON saju_products(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_saju_products_price ON saju_products(price);

-- 코멘트 추가
COMMENT ON COLUMN saju_products.target_gender IS '상품 대상 성별 (남/여/공용)';
COMMENT ON COLUMN saju_products.purpose IS '상품 용도 (self: 본인용, gift: 선물용, both: 둘 다)';
COMMENT ON COLUMN saju_products.popularity_score IS '인기도 점수 (0-100, 높을수록 인기)';
COMMENT ON COLUMN saju_products.review_count IS '리뷰 개수';
COMMENT ON COLUMN saju_products.original_price IS '원래 가격 (할인 전)';
