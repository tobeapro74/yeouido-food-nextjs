/**
 * MongoDB 인덱스 마이그레이션 스크립트
 * 실행: npx ts-node scripts/migrate-indexes.ts
 * 또는: npx tsx scripts/migrate-indexes.ts
 */

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

interface IndexDefinition {
  key: Record<string, 1 | -1>;
  options: {
    unique?: boolean;
    expireAfterSeconds?: number;
    background?: boolean;
  };
}

const INDEX_DEFINITIONS: Record<string, IndexDefinition[]> = {
  google_reviews_cache: [
    { key: { restaurantName: 1 }, options: { unique: true, background: true } },
    { key: { updatedAt: 1 }, options: { expireAfterSeconds: 86400, background: true } },
  ],
  image_cache: [
    { key: { restaurantName: 1 }, options: { background: true } },
    { key: { createdAt: 1 }, options: { background: true } },
  ],
  restaurant_buildings: [
    { key: { restaurantName: 1 }, options: { unique: true, background: true } },
  ],
  user_favorites: [
    { key: { visitorId: 1 }, options: { background: true } },
    { key: { visitorId: 1, restaurantName: 1 }, options: { unique: true, background: true } },
  ],
};

async function migrate() {
  console.log("🚀 MongoDB 인덱스 마이그레이션 시작...\n");

  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("✅ MongoDB 연결 성공\n");

    const db = client.db("yeouido_food");

    for (const [collectionName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
      console.log(`📁 컬렉션: ${collectionName}`);

      const collection = db.collection(collectionName);

      // 기존 인덱스 확인
      const existingIndexes = await collection.indexes();
      console.log(`   기존 인덱스: ${existingIndexes.length}개`);

      for (const { key, options } of indexes) {
        const indexName = Object.keys(key).join("_");

        try {
          const result = await collection.createIndex(key, options);
          console.log(`   ✅ 인덱스 생성: ${result}`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          if (errorMessage.includes("already exists")) {
            console.log(`   ℹ️  인덱스 이미 존재: ${indexName}`);
          } else {
            console.log(`   ❌ 인덱스 생성 실패: ${indexName} - ${errorMessage}`);
          }
        }
      }

      console.log("");
    }

    // 인덱스 통계 출력
    console.log("📊 인덱스 통계:");
    for (const collectionName of Object.keys(INDEX_DEFINITIONS)) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`   ${collectionName}: ${indexes.length}개 인덱스`);

      for (const idx of indexes) {
        const keyStr = Object.entries(idx.key)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ");
        const unique = idx.unique ? " (unique)" : "";
        const ttl = idx.expireAfterSeconds
          ? ` (TTL: ${idx.expireAfterSeconds}초)`
          : "";
        console.log(`      - ${idx.name}: {${keyStr}}${unique}${ttl}`);
      }
    }

    console.log("\n✅ 마이그레이션 완료!");
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("📤 MongoDB 연결 종료");
  }
}

migrate();
