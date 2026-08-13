#!/usr/bin/env node
/**
 * split-groups.js — 构建后处理：把 osmosfeed 的单页全量 HTML 拆成：
 *   public/index.html          首页（最近 HOME_DAYS 天 + 每源保底最新 1 篇 + 完整导航）
 *   public/groups/<group>.html 每个分组的独立静态页（该组全量 + 完整导航）
 *
 * 路由：?group=X 由 functions/index.js (Pages Function) 301 到 /groups/X.html。
 * 在 package.json build 链里跑：osmosfeed && node scripts/split-groups.js
 * （云端 CF 构建跑 npm run build，同样会执行本脚本）。
 *
 * 依赖 cheerio（@tianheg/osmosfeed 的依赖，hoist 到顶层 node_modules）。
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const GROUPS_DIR = path.join(PUBLIC_DIR, "groups");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");
/** 首页保留最近 N 天（日历日，按 build 日期区块计） */
const HOME_DAYS = 3;

if (!fs.existsSync(INDEX_FILE)) {
  console.error("[split-groups] public/index.html 不存在，跳过（请先运行 osmosfeed 构建）");
  process.exit(1);
}

const html = fs.readFileSync(INDEX_FILE, "utf-8");
const $ = cheerio.load(html);

// 防呆：split-groups 必须基于 osmosfeed 的完整构建产物运行。
// 若 index.html 已被本脚本裁剪过（日期区块 ≤ HOME_DAYS），再跑会把
// groups/ 基于残缺数据重建——直接报错退出，提示先重跑 osmosfeed。
const dayCount = $("section.daily-content").length;
if (dayCount <= HOME_DAYS) {
  console.error(
    `[split-groups] 检测到 index.html 只有 ${dayCount} 个日期区块（≤ HOME_DAYS=${HOME_DAYS}），` +
      "疑似已被裁剪过。请先重跑 osmosfeed 生成完整产物，再运行本脚本（npm run build 会自动按序执行）。"
  );
  process.exit(1);
}

/** 收集所有分组（与 index.js initGroupFilter 一致，去重 + 排序） */
const groups = [...new Set(
  $("[data-group]")
    .map((_, el) => $(el).attr("data-group"))
    .get()
    .filter(Boolean)
)].sort();
console.log(`[split-groups] 检测到 ${groups.length} 个分组: ${groups.join(", ")}`);

/** 把页面里的相对资源引用改成根绝对路径（分组页在 /groups/ 下，相对路径会解析到 /groups/ 下 404）。
 *  只改 head 的 link[href] 和全文档 script[src]；文章内链接都是完整 URL，守卫条件已排除。 */
function absolutizeAssets(page) {
  page("link[href]").each((_, el) => {
    const $el = page(el);
    const href = $el.attr("href");
    if (href && !href.startsWith("http") && !href.startsWith("/") && !href.startsWith("#")) {
      $el.attr("href", "/" + href);
    }
  });
  page("script[src]").each((_, el) => {
    const $el = page(el);
    const src = $el.attr("src");
    if (src && !src.startsWith("http") && !src.startsWith("/")) {
      $el.attr("src", "/" + src);
    }
  });
}

/** 生成完整导航按钮 HTML（All + 全部分组，当前组高亮） */
function renderNav(currentGroup) {
  const btns = [];
  btns.push(
    `<button class="group-filter__btn${currentGroup === "" ? " group-filter__btn--active" : ""}" ` +
      `data-action="filter-group" data-group="" type="button">All</button>`
  );
  for (const g of groups) {
    btns.push(
      `<button class="group-filter__btn${currentGroup === g ? " group-filter__btn--active" : ""}" ` +
        `data-action="filter-group" data-group="${g.replace(/"/g, "&quot;")}" type="button">${g}</button>`
    );
  }
  return btns.join("\n");
}

/** 从 page 里移除【非目标组】的 section，只保留 group 的内容，返回删除数 */
function removeOtherGroups(page, group) {
  let removed = 0;
  page("[data-group]").each((_, el) => {
    const $el = page(el);
    if ($el.attr("data-group") === group) return; // 保留目标组
    const li = $el.closest("li.card__section");
    if (li.length) {
      li.remove();
      removed++;
    }
  });
  // 移除空的日期区块
  page("section.daily-content").each((_, day) => {
    if (page(day).find("li.card__section").length === 0) page(day).remove();
  });
  return removed;
}

/**
 * 首页裁剪：只保留最近 HOME_DAYS 个日期区块（模板按日期倒序渲染）。
 * 低频源的旧文章不在这里——想看它们去对应分组页（groups/X.html 全量）。
 * 返回删除的文章数。
 */
function trimHomePage(page) {
  const daySections = page("section.daily-content").get();
  if (daySections.length <= HOME_DAYS) return 0;
  let removed = 0;
  daySections.slice(HOME_DAYS).forEach((d) => {
    const $day = page(d);
    removed += $day.find("article.article-item").length;
    $day.remove();
  });
  return removed;
}

// ---- 1. 生成分组页 ----
fs.mkdirSync(GROUPS_DIR, { recursive: true });
let groupTotal = 0;
for (const g of groups) {
  const $page = cheerio.load(html);
  removeOtherGroups($page, g);
  absolutizeAssets($page); // /groups/ 子目录下必须用根绝对路径引用 CSS/JS/favicon
  // 注入完整导航
  $page("#group-filter").html(renderNav(g));
  // 分组页 title 带上组名
  const title = $page("title").text();
  $page("title").text(`${title} — ${g}`);
  const out = path.join(GROUPS_DIR, `${g}.html`);
  fs.writeFileSync(out, $page.html());
  const size = fs.statSync(out).size;
  groupTotal += size;
  console.log(`[split-groups] groups/${g}.html  ${(size / 1024).toFixed(0)} KB`);
}

// ---- 2. 裁剪首页 ----
{
  const $page = cheerio.load(html);
  const removedArticles = trimHomePage($page);
  // 首页也注入完整导航（裁剪后部分组可能没有文章，JS 动态收集会丢组）
  $page("#group-filter").html(renderNav(""));
  fs.writeFileSync(INDEX_FILE, $page.html());
  const size = fs.statSync(INDEX_FILE).size;
  console.log(`[split-groups] index.html  ${(size / 1024).toFixed(0)} KB (裁剪 ${removedArticles} 篇旧文, 保留最近 ${HOME_DAYS} 天; 完整历史见 groups/*.html)`);
}

console.log(`[split-groups] 分组页合计 ${(groupTotal / 1024 / 1024).toFixed(1)} MB`);

// ---- 3. 复制 _headers 到输出目录 ----
// Cloudflare Pages 只认构建输出目录（public/）里的 _headers；public/ 被
// .gitignore，云端构建会重新生成，所以源文件放项目根，构建链里复制过来。
const SRC_HEADERS = path.join(__dirname, "..", "_headers");
if (fs.existsSync(SRC_HEADERS)) {
  fs.copyFileSync(SRC_HEADERS, path.join(PUBLIC_DIR, "_headers"));
  console.log("[split-groups] _headers 已复制到 public/");
} else {
  console.warn("[split-groups] 项目根无 _headers，跳过");
}
