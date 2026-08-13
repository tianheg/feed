/**
 * 处理 ?group=X → 301 到 /groups/X.html
 * osmosfeed 拆分为分组静态页后，URL 驱动的分组视图由这里接管：
 * 首页 query 带 group 时直接跳转对应静态页（服务端，不下载全量 HTML）。
 * 其余请求（/api/saved-articles 等）原样放行。
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const group = url.searchParams.get("group");

  // 只处理根路径 + 带 group 参数；/groups/* 页面自带内容，无需再跳
  // 注意：目标不带 .html——CF Pages pretty URLs 会把 .html 请求 308 到无后缀路径，少一跳
  if (group && (url.pathname === "/" || url.pathname === "/index.html")) {
    const target = `/groups/${encodeURIComponent(group)}`;
    return Response.redirect(new URL(target, url.origin), 301);
  }

  // 放行静态资源与其他 API
  return context.next();
}
