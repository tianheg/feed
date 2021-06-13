import fs from 'fs';
import fetch from 'node-fetch';
import {markdownTable} from 'markdown-table';

const data = fs.readFileSync("./feeds.csv");
const rows = data.toString().split("\n");

const table = rows
  .map((row) => row.split(",").map((column) => column.trim()))
  .filter((row, i) => row.length === 4 && i !== 0)
  .map((row) => row.push(-1) && row); // row[4] to store count of RSS subscribers

async function getLatestSubstatsRes(feedUrl, cacheFilename) {
  const substatsAPI = `https://api.spencerwoo.com/substats/?source=feedly|inoreader|feedsPub&queryKey=${feedUrl}`;

  try {
    const substatsRes = await fetch(substatsAPI, { timeout: 5000 }); // wait for 5s
    let data = await substatsRes.json();
    if (data.status === 200) {
      // Mark lastModified
      data["lastModified"] = new Date().getTime();
      const totalSubs = data.data.totalSubs;
      // Save to cache
      fs.writeFileSync(cacheFilename, JSON.stringify(data));
      return totalSubs;
    } else {
      return -1;
    }
  } catch (err) {
    console.log(`Failed to fetch: ${feedUrl}`);
    throw err;
  }
}

async function getTotalSubs(feedUrl, index) {
  const cacheFilename = `./cache/${encodeURIComponent(feedUrl)}.json`;
  let totalSubs = -1;
  let fromCache = false;

  if (fs.existsSync(cacheFilename)) {
    const cachedRes = JSON.parse(fs.readFileSync(cacheFilename, "utf8"));
    // cache available within 5 days
    const cacheExpired =
      86400 * 1000 * 5 < new Date().getTime() - parseInt(cachedRes.lastModified)
        ? true
        : false;

    totalSubs = !cacheExpired
      ? cachedRes.data.totalSubs
      : await getLatestSubstatsRes(feedUrl, cacheFilename);
    fromCache = !cacheExpired;
  } else {
    totalSubs = await getLatestSubstatsRes(feedUrl, cacheFilename);
  }

  return { feedUrl, index, totalSubs, fromCache };
}

async function getResultAndUpdateREADME() {
  const feedTable = table
    .map((row, index) => row.push(index) && row) // row[5]: original table index
    .filter((row) => row[2]); // Have RSS

  while (feedTable.length) {
    const resPromise = [];

    feedTable.splice(-20, 20).forEach((row) => {
      resPromise.push(getTotalSubs(row[2], row[5]));
    });

    await Promise.allSettled(resPromise).then((responses) => {
      responses.forEach((res) => {
        if (res.status === "fulfilled") {
          // succeeded
          // console.debug(`INFO: ${JSON.stringify(res.value)}`);
          table[res.value.index][4] = res.value.totalSubs;
        }
        if (res.status === "rejected") {
          // failed
          // no-op
        }
      });
    });
  }

  // Sort by RSS subscribers count first, then by alphanumeric
  table.sort((a, b) => b[4] - a[4] || a[0] - b[0]);

  const newTable = table.map((row) => {
    const subscribeCount =
      row[4] >= 1000 ? row[4] : (row[4] + "").replace(/\d/g, "*");
    return [
      row[4] >= 0
        ? `[![](https://badgen.net/badge/icon/${subscribeCount}?icon=rss&label)](${row[2]})`
        : "",
      row[0].replace(/\|/g, "&#124;"),
      row[1],
      row[3],
    ];
  });

  // update README
  const tableContentInMD = markdownTable([
    ["&nbsp;", "Title", "Link", "Tags"],
    ...newTable,
  ]);

  const readmeContent = `# My Info Source(through RSS)

Use [osmos::feed](https://github.com/osmoscraft/osmosfeed) to generate it.

${tableContentInMD}
`;

  fs.writeFileSync("./README.md", readmeContent, "utf8");
}

getResultAndUpdateREADME();
