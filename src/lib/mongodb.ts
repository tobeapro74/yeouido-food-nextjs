import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("MONGODB_URI 환경변수가 설정되지 않았습니다. MongoDB 기능이 비활성화됩니다.");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesCreated = false;

// 인덱스 정의
const INDEX_DEFINITIONS = {
  google_reviews_cache: [
    { key: { restaurantName: 1 }, options: { unique: true } },
    { key: { updatedAt: 1 }, options: { expireAfterSeconds: 86400 } }, // 24시간 TTL
  ],
  image_cache: [
    { key: { restaurantName: 1 }, options: {} },
    { key: { createdAt: 1 }, options: {} },
  ],
  restaurant_buildings: [
    { key: { restaurantName: 1 }, options: { unique: true } },
  ],
  user_favorites: [
    { key: { visitorId: 1 }, options: {} },
    { key: { visitorId: 1, restaurantName: 1 }, options: { unique: true } },
  ],
  naver_place_cache: [
    { key: { restaurantName: 1 }, options: { unique: true } },
    { key: { updatedAt: 1 }, options: { expireAfterSeconds: 604800 } }, // 7일 TTL
  ],
} as const;

// 인덱스 생성 함수
async function ensureIndexes(db: Db): Promise<void> {
  if (indexesCreated) return;

  try {
    for (const [collectionName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
      const collection = db.collection(collectionName);

      for (const { key, options } of indexes) {
        try {
          await collection.createIndex(key, options);
        } catch (error) {
          // 인덱스가 이미 존재하면 무시
          if ((error as Error).message?.includes('already exists')) {
            continue;
          }
          console.warn(`인덱스 생성 실패 (${collectionName}):`, error);
        }
      }
    }
    indexesCreated = true;
    console.log('MongoDB 인덱스 확인 완료');
  } catch (error) {
    console.error('인덱스 생성 중 오류:', error);
  }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI 환경변수가 설정되지 않았습니다.");
  }

  if (cachedClient && cachedDb) {
    // 캐시된 연결이 있어도 인덱스 확인
    if (!indexesCreated) {
      await ensureIndexes(cachedDb);
    }
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db("yeouido_food");

  // 인덱스 생성
  await ensureIndexes(db);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}
