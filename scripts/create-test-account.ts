/**
 * App Store 심사용 테스트 계정 생성 스크립트
 *
 * 사용법:
 * npx tsx scripts/create-test-account.ts
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

// .env.local 파일 직접 파싱
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const envVars: Record<string, string> = {};

    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join("=").trim();
        }
      }
    });

    return envVars;
  } catch {
    return {};
  }
}

const envVars = loadEnv();
const MONGODB_URI = envVars.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

// 테스트 계정 정보
const TEST_ACCOUNT = {
  email: "test@test.com",
  password: "test1234", // App Store Connect에 제출할 비밀번호
  name: "테스트 사용자",
};

async function createTestAccount() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("✅ MongoDB 연결 성공");

    const db = client.db("yeouido_food");
    const usersCollection = db.collection("users");
    const verificationCollection = db.collection("email_verifications");

    // 기존 테스트 계정 확인
    const existingUser = await usersCollection.findOne({
      email: TEST_ACCOUNT.email,
    });

    if (existingUser) {
      // 기존 계정이 있으면 비밀번호 업데이트
      const hashedPassword = await bcrypt.hash(TEST_ACCOUNT.password, 10);
      await usersCollection.updateOne(
        { email: TEST_ACCOUNT.email },
        { $set: { password: hashedPassword } }
      );
      console.log("✅ 기존 테스트 계정 비밀번호 업데이트 완료");
    } else {
      // 새 계정 생성
      const lastUser = await usersCollection
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      const newId = lastUser.length > 0 ? (lastUser[0].id || 0) + 1 : 1;

      const hashedPassword = await bcrypt.hash(TEST_ACCOUNT.password, 10);

      // 이메일 인증 우회를 위해 인증 레코드 생성
      await verificationCollection.insertOne({
        email: TEST_ACCOUNT.email,
        code: "000000",
        verified: true,
        verifiedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // 사용자 생성
      await usersCollection.insertOne({
        id: newId,
        name: TEST_ACCOUNT.name,
        email: TEST_ACCOUNT.email,
        password: hashedPassword,
        is_admin: false,
        created_at: new Date(),
      });

      // 인증 레코드 삭제
      await verificationCollection.deleteMany({ email: TEST_ACCOUNT.email });

      console.log("✅ 새 테스트 계정 생성 완료");
    }

    console.log("");
    console.log("========================================");
    console.log("📱 App Store Connect 심사 정보");
    console.log("========================================");
    console.log(`이메일: ${TEST_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_ACCOUNT.password}`);
    console.log("========================================");
    console.log("");
    console.log("위 정보를 App Store Connect > 앱 심사 정보에 입력하세요.");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await client.close();
    console.log("MongoDB 연결 종료");
  }
}

createTestAccount();
