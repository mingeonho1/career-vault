import { test, expect } from "playwright/test";

test("랜딩 렌더 → CTA 클릭 → 로그인 페이지 도달", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("link", { name: /시작|로그인|가입|무료/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login/);
});

test("대기명단 페이지 접근 → 이메일 폼 UI 표시", async ({ page }) => {
  await page.goto("/waitlist");
  await expect(
    page.getByRole("heading", { name: "프리미엄 대기명단" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "대기명단 등록하기" }),
  ).toBeVisible();
});
