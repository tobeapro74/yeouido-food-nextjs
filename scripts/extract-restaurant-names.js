// yeouido-food.ts에서 모든 식당 이름을 추출하는 스크립트
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/yeouido-food.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// 이름: "..." 패턴 추출
const namePattern = /이름: "([^"]+)"/g;
const names = [];
let match;

while ((match = namePattern.exec(content)) !== null) {
  names.push(match[1]);
}

// 중복 제거
const uniqueNames = [...new Set(names)];

console.log(`총 ${uniqueNames.length}개의 식당 발견\n`);
console.log('const restaurants = [');
uniqueNames.forEach(name => {
  console.log(`  "${name}",`);
});
console.log('];');
