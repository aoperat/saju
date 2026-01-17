-- saju_products 테이블 생성
CREATE TABLE IF NOT EXISTS saju_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element TEXT NOT NULL CHECK (element IN ('목', '화', '토', '금', '수')),
  category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL,
  coupang_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_saju_products_element ON saju_products(element);
CREATE INDEX IF NOT EXISTS idx_saju_products_is_active ON saju_products(is_active);
CREATE INDEX IF NOT EXISTS idx_saju_products_element_active ON saju_products(element, is_active);

-- RLS (Row Level Security) 활성화
ALTER TABLE saju_products ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (모든 사용자가 상품 조회 가능)
CREATE POLICY "saju_products_public_read" 
  ON saju_products FOR SELECT 
  USING (is_active = true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION saju_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER saju_products_update_updated_at 
  BEFORE UPDATE ON saju_products 
  FOR EACH ROW 
  EXECUTE FUNCTION saju_update_updated_at_column();
