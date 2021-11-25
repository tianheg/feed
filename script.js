import fs from "fs";
import { markdownTable } from "markdown-table";

const data = fs.readFileSync("./feeds.csv");
const rows = data.toString().split("\n");

const table = rows
  .map((row) => row.split(",").map((column) => column.trim()))
  .filter((row, i) => row.length === 4 && i !== 0)
  .map((row) => row.push(-1) && row);

async function getResultAndUpdateREADME() {
  const newTable = table.map((row) => {
    return [row[0].replace(/\|/g, "&#124;"), row[1], row[3]];
  });

  // update README
  const tableContentInMD = markdownTable([
    ["简介", "链接", "标签"],
    ...newTable,
  ]);

  const readmeContent = `* My Info Source(through RSS)
Use [[https://github.com/osmoscraft/osmosfeed][osmos::feed]] to generate [[https://tianheg.github.io/feed/][web page]].
${tableContentInMD}`;
  fs.writeFileSync("./README.org", readmeContent, "utf8");
}

getResultAndUpdateREADME();
