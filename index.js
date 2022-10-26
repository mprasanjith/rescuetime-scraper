require("dotenv").config();
const fetch = require("node-fetch");
const _ = require("lodash");
const { Parser } = require("json2csv");
const fs = require("fs");

const apiKey = process.env.RESCUETIME_API_KEY;

async function callRescueTimeAnalyticsApi(params) {
  params.key = apiKey;
  params.format = "json";

  const req = await fetch(
    "https://www.rescuetime.com/anapi/data?" + new URLSearchParams(params)
  );
  const res = await req.json();
  return res;
}

async function fetchHourlySummary(startDate, endDate) {
  const params = {
    perspective: "interval",
    resolution_time: "hour",
    restrict_begin: startDate,
    restrict_end: endDate,
    restrict_kind: "overview",
  };

  const hourlySummary = await callRescueTimeAnalyticsApi(params);
  return hourlySummary;
}

async function fetchHourlyProductivity(startDate, endDate) {
  const params = {
    perspective: "interval",
    resolution_time: "hour",
    restrict_begin: startDate,
    restrict_end: endDate,
    restrict_kind: "productivity",
  };

  const hourlyProductivity = await callRescueTimeAnalyticsApi(params);
  return hourlyProductivity;
}

async function getSecondsSpentByCategory(hourlySummary) {
  const headers = hourlySummary.row_headers;
  const rows = hourlySummary.rows;

  const objects = rows.map((row) => {
    return row.reduce((acc, val, idx) => {
      acc[headers[idx]] = val;
      return acc;
    }, {});
  });

  const secondsSpentByCategory = _.chain(objects)
    .groupBy("Date")
    .mapValues((group) => {
      return _.chain(group)
        .map((obj) => ({
          [obj["Category"]]: obj["Time Spent (seconds)"],
        }))
        .reduce(_.merge)
        .value();
    })
    .value();
  return secondsSpentByCategory;
}

async function getProductivityByHour(hourlyProductivity) {
  const headers = hourlyProductivity.row_headers;
  const rows = hourlyProductivity.rows;

  const objects = rows.map((row) => {
    return row.reduce((acc, val, idx) => {
      acc[headers[idx]] = val;
      return acc;
    }, {});
  });

  const productivityByHour = _.chain(objects)
    .groupBy("Date")
    .mapValues((group) =>
      _.chain(group)
        .map((obj) => ({
          ["Score" + obj["Productivity"]]: obj["Time Spent (seconds)"],
        }))
        .reduce(_.merge)
        .value()
    )
    .value();
  return productivityByHour;
}

async function main() {
  const startDate = "2020-09-01";
  const endDate = "2020-09-30";
  const outDir = "./output";

  const secondsByCategory = await fetchHourlySummary(startDate, endDate).then(
    getSecondsSpentByCategory
  );
  const secondsByProductivity = await fetchHourlyProductivity(
    startDate,
    endDate
  ).then(getProductivityByHour);

  const merged = _.merge(secondsByCategory, secondsByProductivity);
  const data = _.map(merged, function (value, key) {
    return { date: key, ...value };
  });

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  fs.writeFileSync(
    `${outDir}/rescuetime-data-${startDate}-${endDate}.csv`,
    csv
  );
}

main();
