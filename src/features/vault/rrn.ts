/**
 * 주민등록번호 패턴 감지 — 저장 전 텍스트 스캔에 사용한다.
 * 감지만 하고 추출/저장은 하지 않는다.
 */

// 6자리 + 구분자(하이픈/en-dash/em-dash, 공백 허용) + 7자리
// 전화번호(3-4-4), 사업자번호(3-2-5) 와 구분하기 위해 \b로 경계를 잡는다
const RRN_PATTERN = /\b\d{6}\s*[-–—]\s*\d{7}\b/;

export function detectRrn(text: string): boolean {
  return RRN_PATTERN.test(text);
}
