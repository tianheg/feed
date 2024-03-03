import fs from "fs";
import http from "http";
import https from "https";

// Read the JSON file
const data = fs.readFileSync("public/feeds-json.json", "utf8");

// Parse the JSON file to get an array of objects
const sites = JSON.parse(data);

// Function to check a single website

const checkWebsite = (site) => {
  const siteUrl = new URL(site.Url);
  const protocol = siteUrl.protocol === "https:" ? https : http;

  const options = {
    hostname: siteUrl.hostname,
    path: siteUrl.path,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  };

  protocol
    .get(options, (res) => {
      console.log(`Status code for ${site.Url}:`, res.statusCode);

      if (res.statusCode === 200) {
        console.log(`${site.Url} is up and running normally.`);
      } else {
        console.log(`${site.Url} is not running normally.`);
        fs.appendFile(
          "errorsites.txt",
          `${site.Url} ${res.statusCode}\n`,
          (err) => {
            if (err) throw err;
          }
        );
      }
    })
    .on("error", (e) => {
      console.error(`Error for ${site.Url}:`, e.message);
      fs.appendFile(
        "errorsites.txt",
        `${site.Url} Error: ${e.message}\n`,
        (err) => {
          if (err) throw err;
        }
      );
    });
};

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check each website with a delay
const checkWebsitesWithDelay = async () => {
  for (const site of sites) {
    checkWebsite(site);
    await delay(1000); // Wait for 1 seconds
  }
};

checkWebsitesWithDelay().then(() => {
  process.exit(0);
});
