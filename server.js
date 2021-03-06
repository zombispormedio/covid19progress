const express = require("express");
const got = require("got");
const cheerio = require("cheerio");
const zip = require("lodash.zip");
const Sentry = require("@sentry/node");

const app = express();

const resourceUrl = "https://www.worldometers.info/coronavirus";

app.use(express.static("public"));

const getPlace = node => {
  if (node.firstChild.type === "text" && node.firstChild.data.trim()) {
    return node.firstChild.data;
  }

  const contentNode = node.children.find(item => item.type === "tag");

  if (!contentNode.firstChild) return;

  return contentNode.firstChild.data;
};

const transformData = ([placeNode, totalCasesNode, activeCasesNode]) => {
  const activeCases = (activeCasesNode.firstChild && activeCasesNode.firstChild.data !== "N/A")
    ? Number(activeCasesNode.firstChild.data.replace(/,|\+/g, ""))
    : "N/A";

  const totalCases = (totalCasesNode.firstChild && totalCasesNode.firstChild.data !== "N/A")
    ? Number(totalCasesNode.firstChild.data.replace(/,|\+/g, ""))
    : "N/A";
  return {
    place: getPlace(placeNode),
    totalCases,
    activeCases
  };
};

const wrapErrors = controller => async (req, res, next) => {
  try {
    await controller(req, res);
  } catch (e) {
    next(e);
  }
};

app.use(Sentry.Handlers.requestHandler());

app.get(
  "/api/status",
  wrapErrors(async (req, res) => {
    const response = await got(resourceUrl);
    const $ = cheerio.load(response.body);

    const placesNodes = $(
      "#main_table_countries_today > tbody:nth-child(2) > tr > td:nth-child(2)"
    );

    const totalCasesNodes = $(
      "#main_table_countries_today > tbody:nth-child(2) > tr > td:nth-child(3)"
    );

    const activeCasesNodes = $(
      "#main_table_countries_today > tbody:nth-child(2) > tr > td:nth-child(8)"
    );

    const data = zip(placesNodes, totalCasesNodes, activeCasesNodes)
      .map(transformData)
      .sort((a, b) => {
        if (a.totalCases < b.totalCases) return 1;
        if (a.totalCases > b.totalCases) return -1;
        return 0;
      });

    res.json(data.filter(item => Boolean(item.place)));
  })
);

app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

Sentry.init({ dsn: process.env.SENTRY_ENV });

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
