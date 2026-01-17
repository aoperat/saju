/**
 * JSON 파일의 상품 데이터를 Supabase로 마이그레이션하는 스크립트
 * 
 * 사용 방법:
 * 1. .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY 설정
 * 2. node --env-file=.env scripts/migrate-products-to-supabase.js 실행
 *    또는 dotenv-cli 사용: npx dotenv-cli node scripts/migrate-products-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일에서 환경 변수 로드 (간단한 파서)
function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    // .env 파일이 없어도 환경 변수가 이미 설정되어 있을 수 있음
  }
}

// 환경 변수 로드
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 .env 파일에 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 상품 디렉토리 경로
const productsDir = join(__dirname, '../src/data/상품');

// 오행별 디렉토리 목록
const elements = ['목', '화', '토', '금', '수'];

/**
 * 모든 JSON 파일에서 상품 데이터를 읽어옴
 */
async function loadAllProducts() {
  const allProducts = [];

  for (const element of elements) {
    const elementDir = join(productsDir, element);
    
    try {
      const files = await readdir(elementDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = join(elementDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        if (jsonData[element] && Array.isArray(jsonData[element])) {
          // 각 상품에 element 필드가 이미 있는지 확인하고 없으면 추가
          const products = jsonData[element].map(product => ({
            ...product,
            element: product.element || element, // element 필드 보장
          }));
          
          allProducts.push(...products);
          console.log(`✅ ${file}: ${products.length}개 상품 로드됨 (${element})`);
        }
      }
    } catch (error) {
      console.error(`❌ ${element} 디렉토리 읽기 실패:`, error.message);
    }
  }

  return allProducts;
}

/**
 * Supabase에 상품 데이터 삽입 (중복 방지)
 */
async function migrateProducts(products) {
  console.log(`\n📦 총 ${products.length}개 상품을 Supabase에 마이그레이션합니다...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // 중복 체크: 동일한 id나 name이 이미 존재하는지 확인
      const { data: existing } = await supabase
        .from('saju_products')
        .select('id, name')
        .or(`id.eq.${product.id},name.eq.${product.name}`)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  건너뜀: "${product.name}" (이미 존재)`);
        skipCount++;
        continue;
      }

      // Supabase에 삽입
      const { data, error } = await supabase
        .from('saju_products')
        .insert([
          {
            id: product.id, // 원본 JSON의 id 유지 (UUID 형식이 아니어도 가능)
            element: product.element,
            category: product.category || null,
            name: product.name,
            description: product.description || null,
            image_url: product.image_url || null,
            price: product.price,
            coupang_url: product.coupang_url || null,
            is_active: true,
          },
        ])
        .select();

      if (error) {
        // UUID 형식이 아닌 id의 경우, Supabase가 자동 생성하도록 id 필드 제거 후 재시도
        if (error.message.includes('invalid input syntax for type uuid')) {
          const { data: retryData, error: retryError } = await supabase
            .from('saju_products')
            .insert([
              {
                // id 필드 제거 (Supabase가 자동 생성)
                element: product.element,
                category: product.category || null,
                name: product.name,
                description: product.description || null,
                image_url: product.image_url || null,
                price: product.price,
                coupang_url: product.coupang_url || null,
                is_active: true,
              },
            ])
            .select();

          if (retryError) {
            console.error(`❌ 실패: "${product.name}"`, retryError.message);
            errorCount++;
          } else {
            console.log(`✅ 추가: "${product.name}"`);
            successCount++;
          }
        } else {
          console.error(`❌ 실패: "${product.name}"`, error.message);
          errorCount++;
        }
      } else {
        console.log(`✅ 추가: "${product.name}"`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ 오류: "${product.name}"`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 마이그레이션 완료:`);
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ⏭️  건너뜀: ${skipCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 상품 데이터 마이그레이션 시작...\n');

  try {
    // 1. 모든 JSON 파일에서 상품 데이터 로드
    const products = await loadAllProducts();

    if (products.length === 0) {
      console.log('❌ 로드된 상품이 없습니다.');
      return;
    }

    // 2. Supabase에 마이그레이션
    await migrateProducts(products);

    console.log('\n✨ 마이그레이션이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
