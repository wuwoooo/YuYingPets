/**
 * 判断名称是否与查询字符串匹配（支持汉字模糊匹配和拼音首字母/英文匹配）
 * @param name 待匹配的姓名
 * @param query 查询关键字
 */
export function matchPinyinOrChinese(name: string, query: string): boolean {
  if (!name) return false;
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) return true;

  // 1. 如果包含中文，直接模糊匹配
  if (/[\u4e00-\u9fa5]/.test(lowerQuery)) {
    return name.toLowerCase().includes(lowerQuery);
  }

  // 2. 纯英文/拼音首字母匹配
  const nameLetters = Array.from(name).map(char => {
    if (/^[a-zA-Z0-9]$/.test(char)) {
      return char.toLowerCase();
    }
    const uni = char.charCodeAt(0);
    if (uni >= 0x4e00 && uni <= 0x9fa5) {
      const boundaryChars = ["啊", "芭", "擦", "搭", "蛾", "发", "噶", "哈", "击", "喀", "垃", "妈", "拿", "哦", "啪", "期", "然", "撒", "塌", "挖", "昔", "压", "匝"];
      const letters = "abcdefghjklmnopqrstwxyz";
      for (let i = 0; i < boundaryChars.length; i++) {
        if (char.localeCompare(boundaryChars[i], "zh") < 0) {
          return i === 0 ? "" : letters.charAt(i - 1);
        }
      }
      return "z";
    }
    return "";
  }).join("");

  return nameLetters.includes(lowerQuery) || name.toLowerCase().includes(lowerQuery);
}
