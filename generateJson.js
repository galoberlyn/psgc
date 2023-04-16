const R = require("ramda");
const csv = require("csvtojson");
const fs = require("file-system");
const csvFilePath =
  "./publicationFiles/2_PSGC 2Q-2022-Publication-Datafile.csv";
const jsonFileName = "psgc.json";
const jsonFilePath = `./${jsonFileName}`;

(async function () {
  console.log(`Reading csv file: ${csvFilePath}`);
  const jsonArray = await csv({
    headers: [
      "psgc10DigitCode",
      "name",
      "code",
      "geographicLevel",
      "oldName",
      "cityClass",
      "incomeClassification",
      "urbanRural",
      "population2015",
      "emptyField",
      "population2020",
    ],
  }).fromFile(csvFilePath);

  console.log(`Converting to json`);
  const jsonArrayFormatted = R.map(
    R.omit(["population2015", "emptyField", "population2020", "field12"]),
    jsonArray
  );

  console.log(`Saving to file: ${jsonFilePath}`);
  const jsonArrayFormattedStringified = JSON.stringify(jsonArrayFormatted);
  fs.writeFileSync(jsonFilePath, jsonArrayFormattedStringified);

  console.log(`Done.`);
  console.log(
    `Kindly open the generated file making sure characters like Santo Niño has the correct character.`
  );
  console.log(
    `If character is showing question mark, save the csv file using utf-8 encoding in notepad.`
  );
})();
