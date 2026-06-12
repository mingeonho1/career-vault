/* eslint-disable no-console */
/**
 * tistory-post.mjs — 티스토리 반자동 발행 스크립트
 *
 * 사용법:
 *   pnpm post:tistory posts/글파일.md [블로그이름] [카테고리]
 *
 * 동작:
 *   1. 크롬 창이 열림 (전용 프로필 ~/.tistory-playwright — 로그인 1회 후 유지됨)
 *   2. 로그인이 필요하면 사용자가 직접 로그인 (스크립트는 글쓰기 페이지 진입까지 대기)
 *   3. 카테고리 선택 + 제목 입력 + 마크다운 모드 전환 + 본문 자동 입력(실제 입력 이벤트)
 *      + 발행 레이어 오픈(공개 선택)까지 자동
 *   4. 최종 [공개 발행] 클릭은 사람이 직접 (검토 후)
 *
 * 실패 시: 본문을 클립보드에 복사해두므로 에디터에 Cmd+V로 붙여넣으면 됨.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const LOGIN_WAIT_MINUTES = 10;
const DEFAULT_CATEGORY = "AI";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs() {
  const [, , mdPath, blogName = "mingeonho1", category = DEFAULT_CATEGORY] =
    process.argv;
  if (!mdPath)
    fail("사용법: pnpm post:tistory <md파일경로> [블로그이름] [카테고리]");
  if (!fs.existsSync(mdPath)) fail(`파일 없음: ${mdPath}`);
  return { mdPath, blogName, category };
}

function parsePost(mdPath) {
  const raw = fs.readFileSync(mdPath, "utf-8").trim();
  const lines = raw.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) fail("md 파일 첫 부분에 '# 제목' 형식의 제목이 필요함");
  const title = titleLine.replace(/^# /, "").trim();
  const body = lines
    .slice(lines.indexOf(titleLine) + 1)
    .join("\n")
    .trim();
  return { title, body };
}

function copyToClipboard(text) {
  try {
    execSync("pbcopy", { input: text });
    return true;
  } catch {
    return false;
  }
}

async function waitForEditor(page, blogName) {
  const writeUrl = `https://${blogName}.tistory.com/manage/newpost/`;
  await page.goto(writeUrl, { waitUntil: "domcontentloaded" });

  if (!page.url().includes("/manage/newpost")) {
    console.log(
      `🔑 로그인이 필요합니다. 열린 브라우저에서 로그인해주세요 (${LOGIN_WAIT_MINUTES}분 대기)...`,
    );
    console.log("   로그인 후 자동으로 글쓰기 페이지로 이동합니다.");
  }
  await page.waitForURL("**/manage/newpost/**", {
    timeout: LOGIN_WAIT_MINUTES * 60 * 1000,
  });
  await page.waitForSelector("#post-title-inp, textarea[placeholder*='제목']", {
    timeout: 60_000,
  });
}

async function fillTitle(page, title) {
  const selector = (await page.$("#post-title-inp"))
    ? "#post-title-inp"
    : "textarea[placeholder*='제목']";
  await page.fill(selector, title);
}

async function selectCategory(page, category) {
  // 제목 위 카테고리 셀렉터 → 목록에서 이름 일치 항목 클릭. 실패해도 발행 흐름은 계속.
  try {
    await page
      .locator("#category-btn, button:has-text('카테고리')")
      .first()
      .click({ timeout: 5_000 });
    await page
      .locator(
        `#category-list :text-is('${category}'), [role='listbox'] :text-is('${category}')`,
      )
      .first()
      .click({ timeout: 5_000 });
    console.log(`📁 카테고리 선택: ${category}`);
  } catch {
    console.log(
      `ℹ️  카테고리 "${category}" 자동 선택 실패 — 블로그에 해당 카테고리가 있는지 확인하고, 발행 전 직접 선택해주세요.`,
    );
  }
}

async function switchToMarkdownMode(page) {
  await page.click("#editor-mode-layer-btn-open");
  await page.click("#editor-mode-markdown");
}

async function fillBody(page, body) {
  // 주의: cm.setValue()는 화면에만 반영되고 티스토리 내부 상태와 동기화되지 않아
  // 발행 시 빈 본문이 저장됨 → 실제 키보드 입력 경로(insertText)로 주입한다.
  const editor = page.locator(".CodeMirror:visible").first();
  await editor.waitFor({ timeout: 30_000 });
  await editor.click();
  await page.keyboard.insertText(body);

  // 주입 검증: 에디터 상태에 본문이 실제로 들어갔는지 길이로 확인
  const injected = await page.evaluate(() => {
    const editors = [...document.querySelectorAll(".CodeMirror")];
    const visible = editors.find((el) => el.offsetParent !== null);
    return visible?.CodeMirror?.getValue()?.length ?? 0;
  });
  if (injected < body.length * 0.9) {
    throw new Error(`본문 주입 불완전 (${injected}/${body.length}자) — 발행하지 마세요`);
  }
  console.log(`✍️  본문 주입 확인: ${injected}자`);
}

async function openPublishLayer(page) {
  // 하단 우측 "완료" 버튼 → 발행 설정 레이어가 열림. 최종 "공개 발행" 클릭은 사람 몫.
  const candidates = [
    "#publish-layer-btn-open",
    "button:has-text('완료')",
    ".btn-publish",
  ];
  for (const sel of candidates) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0 && (await el.isVisible())) {
      await el.click();
      await preparePublishLayer(page);
      return sel;
    }
  }
  return null;
}

async function preparePublishLayer(page) {
  // 기본값이 비공개라 공개 라디오를 자동 선택하고, 최종 발행 버튼을 화면에 들어오게 스크롤
  try {
    await page
      .locator("label:text-is('공개')")
      .first()
      .click({ timeout: 5_000 });
  } catch {
    console.log("ℹ️  공개 라디오 자동 선택 실패 — 발행 전에 직접 공개로 바꿔주세요.");
  }
  try {
    const publishBtn = page
      .locator("#publish-btn, button:has-text('발행')")
      .last();
    await publishBtn.scrollIntoViewIfNeeded({ timeout: 5_000 });
  } catch {
    console.log("ℹ️  발행 버튼이 화면 밖에 있을 수 있음 — 레이어를 아래로 스크롤하세요.");
  }
}

async function saveDebugShot(page, name) {
  try {
    const file = path.join(process.cwd(), name);
    await page.screenshot({ path: file, fullPage: false });
    console.log(
      `📸 현재 화면 스크린샷 저장: ${file} (Claude에게 보여주면 원인 파악 가능)`,
    );
  } catch {
    /* 스크린샷 실패는 무시 */
  }
}

function launchBrowser() {
  const profileDir = path.join(os.homedir(), ".tistory-playwright");
  return chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: null,
    args: ["--window-size=1500,1150"],
  });
}

function attachDialogHandler(page) {
  // 팝업 처리: "이어서 작성" 제안은 거절(새 글 기준), 모드 전환 등 나머지 확인은 수락
  page.on("dialog", (d) => {
    const action = d.message().includes("이어") ? d.dismiss() : d.accept();
    action.catch(() => {});
  });
}

async function runPipeline(page, { blogName, category, title, body }) {
  await waitForEditor(page, blogName);
  await selectCategory(page, category);
  await fillTitle(page, title);
  await switchToMarkdownMode(page);
  await fillBody(page, body);
  return openPublishLayer(page);
}

async function reportResult(page, publishSel) {
  if (publishSel) {
    console.log(
      "✅ 입력 완료 + 발행 레이어를 열고 공개로 설정했습니다. 내용 확인 후 [공개 발행] 버튼만 직접 눌러주세요.",
    );
  } else {
    console.log(
      "✅ 본문 입력 완료. 단, 완료/발행 버튼을 못 찾았습니다 — 아래 스크린샷을 확인하세요.",
    );
    await saveDebugShot(page, "tistory-debug.png");
  }
  console.log("   (발행 후 브라우저를 닫으면 스크립트가 종료됩니다)");
}

async function reportFailure(page, err, title, body) {
  console.error(`⚠️  자동 입력 실패: ${err.message}`);
  await saveDebugShot(page, "tistory-error.png");
  const copied = copyToClipboard(`# ${title}\n\n${body}`);
  console.log(
    copied
      ? "📋 본문을 클립보드에 복사해뒀습니다. 에디터(마크다운 모드)에 Cmd+V 하세요."
      : "클립보드 복사도 실패 — md 파일을 직접 열어 복사하세요.",
  );
  console.log(
    "   원인은 보통 티스토리 에디터 DOM 변경입니다. 에러 메시지를 Claude에게 보여주면 셀렉터를 고칠 수 있습니다.",
  );
}

async function main() {
  const { mdPath, blogName, category } = parseArgs();
  const { title, body } = parsePost(mdPath);
  console.log(
    `📝 발행 준비: "${title}" → ${blogName}.tistory.com (카테고리: ${category})`,
  );

  const ctx = await launchBrowser();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  attachDialogHandler(page);

  try {
    const publishSel = await runPipeline(page, {
      blogName,
      category,
      title,
      body,
    });
    await reportResult(page, publishSel);
  } catch (err) {
    await reportFailure(page, err, title, body);
  }

  // 사용자가 발행을 마치고 창을 닫을 때까지 유지
  await new Promise((resolve) => ctx.on("close", resolve));
}

main();
