import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

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

async function checkTestAccount() {
  const client = new MongoClient(MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("yeouido_food");
    const usersCollection = db.collection("users");
    
    const testUser = await usersCollection.findOne({ email: "test@test.com" });
    
    if (testUser) {
      console.log("✅ 테스트 계정 존재:");
      console.log("  - ID:", testUser.id);
      console.log("  - 이름:", testUser.name);
      console.log("  - 이메일:", testUser.email);
      console.log("  - 생성일:", testUser.created_at);
      
      // 비밀번호 확인
      const isValid = await bcrypt.compare("test1234", testUser.password);
      console.log("  - 비밀번호 test1234 검증:", isValid ? "✅ 일치" : "❌ 불일치");
    } else {
      console.log("❌ 테스트 계정이 존재하지 않습니다.");
    }
  } finally {
    await client.close();
  }
}

checkTestAccount();
