import { MongoClient } from "mongodb";
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

async function updateTestAccountAdmin() {
  const client = new MongoClient(MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("yeouido_food");
    const usersCollection = db.collection("users");
    
    const result = await usersCollection.updateOne(
      { email: "test@test.com" },
      { $set: { is_admin: true } }
    );
    
    if (result.modifiedCount > 0) {
      console.log("✅ test@test.com 계정에 관리자 권한 부여 완료");
    } else if (result.matchedCount > 0) {
      console.log("ℹ️ test@test.com 계정은 이미 관리자입니다");
    } else {
      console.log("❌ test@test.com 계정을 찾을 수 없습니다");
    }
    
    // 확인
    const user = await usersCollection.findOne({ email: "test@test.com" });
    if (user) {
      console.log("\n현재 상태:");
      console.log("  - 이메일:", user.email);
      console.log("  - 관리자 여부:", user.is_admin ? "✅ 예" : "❌ 아니오");
    }
  } finally {
    await client.close();
  }
}

updateTestAccountAdmin();
