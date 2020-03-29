const express = require("express");
const got = require("got");
const cheerio = require("cheerio");
const zip = require("lodash.zip");

const app = express();

const resourceUrl = "https://www.worldometers.info/coronavirus";

app.use(express.static("public"));

app.get("/api/status", async (req, res) => {
   const response = await got(resourceUrl);
  const $ = cheerio.load(response.body);

  const countriesRaw = $(
    "#main_table_countries_today > tbody:nth-child(2) > tr > td:first-child"
  );

  const totalCasesRaw = $(
    "#main_table_countries_today > tbody:nth-child(2) > tr > td:nth-child(2)"
  );

  const activeCasesRaw = $(
    "#main_table_countries_today > tbody:nth-child(2) > tr > td:nth-child(7)"
  );

  const data = zip(countriesRaw, totalCasesRaw, activeCasesRaw).map(
    ([country, totalCases, activeCases]) => ({
      country:
        country.firstChild.type === "text"
          ? country.firstChild.data
          : country.firstChild.firstChild.data,
      totalCases: Number(totalCases.firstChild.data.replace(",", "")),
      activeCases: Number(activeCases.firstChild.data.replace(",", ""))
    })
  ).sort((a, b) =>  {
    if(a.totalCases < b.totalCases) return 1;
    if(a.totalCases > b.totalCases) return -1;
    return 0;
  })

  const world = data.reduce(
    (acc, { totalCases, activeCases }) => ({
      totalCases: acc.totalCases + totalCases,
      activeCases: acc.activeCases + activeCases
    }),
    {
      totalCases: 0,
      activeCases: 0
    }
  );
  
  res.json([{country: "World", ...world}, ...data])
})


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
