const R = require("ramda");
const fs = require("file-system");
const titleCase = require("title-case").titleCase;
const psgcJsonData = require("./psgc.json");

const islandGroupsArr = ["luzon", "visayas", "mindanao"];
const luzonPSGCCodes = [
  "130000000",
  "140000000",
  "010000000",
  "020000000",
  "030000000",
  "040000000",
  "170000000",
  "050000000",
];
const visayasPSGCCodes = ["060000000", "070000000", "080000000"];
const mindanaoPSGCCodes = [
  "090000000",
  "100000000",
  "110000000",
  "120000000",
  "160000000",
  "150000000",
];

const generateIslandGroupCodeNames = R.map((ig) => ({
  code: ig,
  name: `${R.toUpper(R.head(ig))}${R.tail(ig)}`,
}));

const filterByGeographicLevel = (geographicLevel, data) =>
  R.filter(
    R.where({
      geographicLevel:
        R.type(geographicLevel) === "Array"
          ? R.includes(R.__, geographicLevel)
          : R.equals(geographicLevel),
    }),
    data
  );

const selectIslandGroupCode = (ig) => {
  if (R.includes(ig.toString(), luzonPSGCCodes)) {
    return "luzon";
  } else if (R.includes(ig.toString(), visayasPSGCCodes)) {
    return "visayas";
  } else if (R.includes(ig.toString(), mindanaoPSGCCodes)) {
    return "mindanao";
  }
};

const getCodes = R.pluck("code");

const writeFile = (path, content) => {
  const stringifiedContent = JSON.stringify(content);
  fs.writeFileSync(`${path}`, stringifiedContent);
};

const fixJSONData = ({
  jsonData,
  type,
  provincesPSGCCodes,
  districtsPSGCCodes,
  municipalitiesPSGCCodes,
  subMunicipalitiesPSGCCodes,
  citiesPSGCCodes,
}) => {
  switch (type) {
    case "regions":
      return R.map((data) => {
        const code = data.code.toString();
        const splitRegionName = (name) => {
          let [matchedRegionName, matchedName] = R.match(/([a-z-\s]+)/gi, name);

          //mimaropa does not have enclosed region name (this should be called first to fix undefined matchedName variable)
          if (!matchedName && R.test(/mimaropa/i, matchedRegionName)) {
            matchedName = matchedRegionName;
            // matchedRegionName = 'MIMAROPA';
            // matchedName = 'MIMAROPA';
          }

          //interchange matchedName and matchedRegionName data
          // let tempData = matchedName;
          // if (R.includes(tempData, ['NCR', 'CAR', 'ARMM'])) {
          //   matchedName = matchedRegionName;
          //   matchedRegionName = tempData;
          // }

          let cleanedName = matchedName;
          if (
            !R.includes(matchedName, [
              "CALABARZON",
              "MIMAROPA",
              "SOCCSKSARGEN",
              "ARMM",
              "BARMM",
              "NCR",
              "CAR",
              "MIMAROPA Region",
            ])
          ) {
            cleanedName = titleCase(R.toLower(R.trim(matchedName)));
          }

          let cleanedRegionName = R.replace(
            /^region/i,
            "Region",
            R.trim(matchedRegionName)
          );
          if (matchedRegionName === "MIMAROPA Region") {
            cleanedRegionName = matchedRegionName;
          } else if (!R.test(/^region/i, matchedRegionName)) {
            cleanedRegionName = titleCase(R.toLower(R.trim(matchedRegionName)));
          }

          return [cleanedName, cleanedRegionName];
        };
        const [name, regionName] = splitRegionName(data.name);
        const islandGroupCode = selectIslandGroupCode(data.code);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        return { code, name, regionName, islandGroupCode, psgc10DigitCode };
      }, jsonData);

    case "provinces":
      return R.map((data) => {
        const code = data.code.toString();
        const name = titleCase(R.toLower(data.name));
        const regionCode = R.take(2, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        return { code, name, regionCode, islandGroupCode, psgc10DigitCode };
      }, jsonData);

    case "districts":
      return R.map((data) => {
        const code = data.code.toString();
        const name = titleCase(
          R.toLower(
            R.trim(
              R.last(
                R.split(",", R.replace(" (Not a Province)", "", data.name))
              )
            )
          )
        );
        const regionCode = R.take(2, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        return { code, name, regionCode, islandGroupCode, psgc10DigitCode };
      }, jsonData);

    case "municipalities":
    case "cities":
      return R.map((data) => {
        const code = data.code.toString();
        const name = titleCase(
          R.toLower(R.replace(/\s\(Capital\)$/, "", data.name))
        );
        const oldName = data.oldName;
        const isCapital = R.test(/\s\(Capital\)$/, data.name) ? true : false;
        const provinceCode =
          R.includes(R.take(4, code).padEnd(9, "0"), provincesPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const districtCode =
          R.includes(R.take(4, code).padEnd(9, "0"), districtsPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const regionCode = R.take(2, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        return {
          code,
          name,
          oldName,
          isCapital,
          provinceCode,
          districtCode,
          regionCode,
          islandGroupCode,
          psgc10DigitCode,
        };
      }, jsonData);

    case "cities-municipalities":
      return R.map((data) => {
        const code = data.code.toString();
        const name = titleCase(
          R.toLower(R.replace(/\s\(Capital\)$/, "", data.name))
        );
        const oldName = data.oldName;
        const isCapital = R.test(/\s\(Capital\)$/, data.name) ? true : false;
        const provinceCode =
          R.includes(R.take(4, code).padEnd(9, "0"), provincesPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const districtCode =
          R.includes(R.take(4, code).padEnd(9, "0"), districtsPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const regionCode = R.take(2, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const isCity = R.equals("City", data.geographicLevel);
        const isMunicipality = R.equals("Mun", data.geographicLevel);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        return {
          code,
          name,
          oldName,
          isCapital,
          isCity,
          isMunicipality,
          provinceCode,
          districtCode,
          regionCode,
          islandGroupCode,
          psgc10DigitCode,
        };
      }, jsonData);

    case "sub-municipalities":
      return R.map((data) => {
        const code = data.code.toString();
        let name = titleCase(R.toLower(data.name));
        const oldName = data.oldName;
        const regionCode = R.take(2, code).padEnd(9, "0");
        const provinceCode =
          R.includes(R.take(4, code).padEnd(9, "0"), provincesPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const districtCode =
          R.includes(R.take(4, code).padEnd(9, "0"), districtsPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        // case error in Tondo I/ii
        if (data.name === "TONDO I/II") {
          name = R.replace("TONDO", "Tondo", data.name);
        }

        return {
          code,
          name,
          oldName,
          districtCode,
          provinceCode,
          regionCode,
          islandGroupCode,
          psgc10DigitCode,
        };
      }, jsonData);

    case "barangays":
      return R.map((data) => {
        const code = data.code.toString();
        const name = data.name;
        const oldName = data.oldName;
        const subMunicipalityCode =
          R.includes(
            R.take(6, code).padEnd(9, "0"),
            subMunicipalitiesPSGCCodes
          ) && R.take(6, code).padEnd(9, "0");
        let cityCode =
          R.includes(R.take(6, code).padEnd(9, "0"), citiesPSGCCodes) &&
          R.take(6, code).padEnd(9, "0");
        const municipalityCode =
          R.includes(R.take(6, code).padEnd(9, "0"), municipalitiesPSGCCodes) &&
          R.take(6, code).padEnd(9, "0");
        const provinceCode =
          R.includes(R.take(4, code).padEnd(9, "0"), provincesPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const districtCode =
          R.includes(R.take(4, code).padEnd(9, "0"), districtsPSGCCodes) &&
          R.take(4, code).padEnd(9, "0");
        const regionCode = R.take(2, code).padEnd(9, "0");
        const islandGroupCode = selectIslandGroupCode(regionCode);
        const psgc10DigitCode = data.psgc10DigitCode.toString();

        // fix for #2 (https://gitlab.com/psgc/api/-/issues/2)
        if (districtCode === "133900000") {
          cityCode = districtCode;
        }

        return {
          code,
          name,
          oldName,
          subMunicipalityCode,
          cityCode,
          municipalityCode,
          districtCode,
          provinceCode,
          regionCode,
          islandGroupCode,
          psgc10DigitCode,
        };
      }, jsonData);

    default:
      return jsonData;
      break;
  }
};

const islandGroups = generateIslandGroupCodeNames(islandGroupsArr);
// console.log(islandGroups);

const regionsPSGCArr = filterByGeographicLevel("Reg", psgcJsonData);
const regions = fixJSONData({ jsonData: regionsPSGCArr, type: "regions" });
// console.log(regions);

const provincesPSGCArr = filterByGeographicLevel("Prov", psgcJsonData);
const provinces = fixJSONData({
  jsonData: provincesPSGCArr,
  type: "provinces",
});
// console.log(provinces);
const provincesPSGCCodes = getCodes(provinces);
// console.log(provincesPSGCCodes);

const districtsPSGCArr = filterByGeographicLevel("Dist", psgcJsonData);
const districts = fixJSONData({
  jsonData: districtsPSGCArr,
  type: "districts",
});
// console.log(districts);
const districtsPSGCCodes = getCodes(districts);
// console.log(districtsPSGCCodes);

const municipalitiesPSGCArr = filterByGeographicLevel("Mun", psgcJsonData);
const municipalities = fixJSONData({
  jsonData: municipalitiesPSGCArr,
  type: "municipalities",
  provincesPSGCCodes,
  districtsPSGCCodes,
});
// console.log(municipalities);
const municipalitiesPSGCCodes = getCodes(municipalities);
// console.log(municipalitiesPSGCCodes);

const subMunicipalitiesPSGCArr = filterByGeographicLevel(
  "SubMun",
  psgcJsonData
);
const subMunicipalities = fixJSONData({
  jsonData: subMunicipalitiesPSGCArr,
  type: "sub-municipalities",
  provincesPSGCCodes,
  districtsPSGCCodes,
});
// console.log(subMunicipalities);
const subMunicipalitiesPSGCCodes = getCodes(subMunicipalities);
// console.log(subMunicipalitiesPSGCCodes);

const citiesPSGCArr = filterByGeographicLevel("City", psgcJsonData);
const cities = fixJSONData({
  jsonData: citiesPSGCArr,
  type: "cities",
  provincesPSGCCodes,
  districtsPSGCCodes,
});
// console.log(cities);
const citiesPSGCCodes = getCodes(cities);
// console.log(citiesPSGCCodes);

const citiesMunicipalitiesPSGCArr = filterByGeographicLevel(
  ["City", "Mun"],
  psgcJsonData
);
const citiesMunicipalities = fixJSONData({
  jsonData: citiesMunicipalitiesPSGCArr,
  type: "cities-municipalities",
  provincesPSGCCodes,
  districtsPSGCCodes,
});
// console.log(citiesMunicipalities);
const citiesMunicipalitiesPSGCCodes = getCodes(citiesMunicipalities);
// console.log(citiesMunicipalities);

const barangaysPSGCArr = filterByGeographicLevel("Bgy", psgcJsonData);
const barangays = fixJSONData({
  jsonData: barangaysPSGCArr,
  type: "barangays",
  provincesPSGCCodes,
  districtsPSGCCodes,
  municipalitiesPSGCCodes,
  subMunicipalitiesPSGCCodes,
  citiesPSGCCodes,
});
// console.log(barangays);

console.log("Writing Island Groups...");
(() => {
  const path = "public/island-groups";

  //default
  writeFile(`${path}/index.html`, islandGroups);
  writeFile(`${path}.json`, islandGroups);

  R.map((ig) => {
    //single
    const sig = R.head(R.filter(R.propEq("code", ig.code), islandGroups));
    writeFile(`${path}/${ig.code}/index.html`, sig);
    writeFile(`${path}/${ig.code}.json`, sig);

    const regionCodes = eval(`${ig.code}PSGCCodes`);

    //regions
    const rig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "code"),
      regions
    );
    writeFile(`${path}/${ig.code}/regions/index.html`, rig);
    writeFile(`${path}/${ig.code}/regions.json`, rig);

    //provinces
    const pig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      provinces
    );
    writeFile(`${path}/${ig.code}/provinces/index.html`, pig);
    writeFile(`${path}/${ig.code}/provinces.json`, pig);

    //districts
    const dig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      districts
    );
    writeFile(`${path}/${ig.code}/districts/index.html`, dig);
    writeFile(`${path}/${ig.code}/districts.json`, dig);

    //cities
    const cig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      cities
    );
    writeFile(`${path}/${ig.code}/cities/index.html`, cig);
    writeFile(`${path}/${ig.code}/cities.json`, cig);

    //municipalities
    const mig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      municipalities
    );
    writeFile(`${path}/${ig.code}/municipalities/index.html`, mig);
    writeFile(`${path}/${ig.code}/municipalities.json`, mig);

    //citiesMunicipalities
    const cmig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      citiesMunicipalities
    );
    writeFile(`${path}/${ig.code}/cities-municipalities/index.html`, cmig);
    writeFile(`${path}/${ig.code}/cities-municipalities.json`, cmig);

    //subMunicipalities
    const smig = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      subMunicipalities
    );
    writeFile(`${path}/${ig.code}/sub-municipalities/index.html`, smig);
    writeFile(`${path}/${ig.code}/sub-municipalities.json`, smig);

    //barangays
    const big = R.filter(
      R.propSatisfies(R.includes(R.__, regionCodes), "regionCode"),
      barangays
    );
    writeFile(`${path}/${ig.code}/barangays/index.html`, big);
    writeFile(`${path}/${ig.code}/barangays.json`, big);
  }, islandGroups);
})();
console.log("Done...");

console.log("Writing Regions...");
(() => {
  const path = "public/regions";

  //default
  writeFile(`${path}/index.html`, regions);
  writeFile(`${path}.json`, regions);

  R.map((region) => {
    //single
    const sig = R.head(R.filter(R.propEq("code", region.code), regions));
    writeFile(`${path}/${region.code}/index.html`, sig);
    writeFile(`${path}/${region.code}.json`, sig);

    //provinces
    const pig = R.filter(R.propEq("regionCode", region.code), provinces);
    writeFile(`${path}/${region.code}/provinces/index.html`, pig);
    writeFile(`${path}/${region.code}/provinces.json`, pig);

    //districts
    const dig = R.filter(R.propEq("regionCode", region.code), districts);
    writeFile(`${path}/${region.code}/districts/index.html`, dig);
    writeFile(`${path}/${region.code}/districts.json`, dig);

    //cities
    const cig = R.filter(R.propEq("regionCode", region.code), cities);
    writeFile(`${path}/${region.code}/cities/index.html`, cig);
    writeFile(`${path}/${region.code}/cities.json`, cig);

    //municipalities
    const mig = R.filter(R.propEq("regionCode", region.code), municipalities);
    writeFile(`${path}/${region.code}/municipalities/index.html`, mig);
    writeFile(`${path}/${region.code}/municipalities.json`, mig);

    //citiesMunicipalities
    const cmig = R.filter(
      R.propEq("regionCode", region.code),
      citiesMunicipalities
    );
    writeFile(`${path}/${region.code}/cities-municipalities/index.html`, cmig);
    writeFile(`${path}/${region.code}/cities-municipalities.json`, cmig);

    //subMunicipalities
    const smig = R.filter(
      R.propEq("regionCode", region.code),
      subMunicipalities
    );
    writeFile(`${path}/${region.code}/sub-municipalities/index.html`, smig);
    writeFile(`${path}/${region.code}/sub-municipalities.json`, smig);

    //barangays
    const big = R.filter(R.propEq("regionCode", region.code), barangays);
    writeFile(`${path}/${region.code}/barangays/index.html`, big);
    writeFile(`${path}/${region.code}/barangays.json`, big);
  }, regions);
})();
console.log("Done...");

console.log("Writing Provinces...");
(() => {
  const path = "public/provinces";

  //default
  writeFile(`${path}/index.html`, provinces);
  writeFile(`${path}.json`, provinces);

  R.map((province) => {
    //single
    const sig = R.head(R.filter(R.propEq("code", province.code), provinces));
    writeFile(`${path}/${province.code}/index.html`, sig);
    writeFile(`${path}/${province.code}.json`, sig);

    //districts
    const dig = R.filter(R.propEq("provinceCode", province.code), districts);
    writeFile(`${path}/${province.code}/districts/index.html`, dig);
    writeFile(`${path}/${province.code}/districts.json`, dig);

    //cities
    const cig = R.filter(R.propEq("provinceCode", province.code), cities);
    writeFile(`${path}/${province.code}/cities/index.html`, cig);
    writeFile(`${path}/${province.code}/cities.json`, cig);

    //municipalities
    const mig = R.filter(
      R.propEq("provinceCode", province.code),
      municipalities
    );
    writeFile(`${path}/${province.code}/municipalities/index.html`, mig);
    writeFile(`${path}/${province.code}/municipalities.json`, mig);

    //citiesMunicipalities
    const cmig = R.filter(
      R.propEq("provinceCode", province.code),
      citiesMunicipalities
    );
    writeFile(
      `${path}/${province.code}/cities-municipalities/index.html`,
      cmig
    );
    writeFile(`${path}/${province.code}/cities-municipalities.json`, cmig);

    //subMunicipalities
    const smig = R.filter(
      R.propEq("provinceCode", province.code),
      subMunicipalities
    );
    writeFile(`${path}/${province.code}/sub-municipalities/index.html`, smig);
    writeFile(`${path}/${province.code}/sub-municipalities.json`, smig);

    //barangays
    const big = R.filter(R.propEq("provinceCode", province.code), barangays);
    writeFile(`${path}/${province.code}/barangays/index.html`, big);
    writeFile(`${path}/${province.code}/barangays.json`, big);
  }, provinces);
})();
console.log("Done...");

console.log("Writing Districts...");
(() => {
  const path = "public/districts";

  //default
  writeFile(`${path}/index.html`, districts);
  writeFile(`${path}.json`, districts);

  R.map((district) => {
    //single
    const sig = R.head(R.filter(R.propEq("code", district.code), districts));
    writeFile(`${path}/${district.code}/index.html`, sig);
    writeFile(`${path}/${district.code}.json`, sig);

    //cities
    const cig = R.filter(R.propEq("districtCode", district.code), cities);
    writeFile(`${path}/${district.code}/cities/index.html`, cig);
    writeFile(`${path}/${district.code}/cities.json`, cig);

    //municipalities
    const mig = R.filter(
      R.propEq("districtCode", district.code),
      municipalities
    );
    writeFile(`${path}/${district.code}/municipalities/index.html`, mig);
    writeFile(`${path}/${district.code}/municipalities.json`, mig);

    //citiesMunicipalities
    const cmig = R.filter(
      R.propEq("districtCode", district.code),
      citiesMunicipalities
    );
    writeFile(
      `${path}/${district.code}/cities-municipalities/index.html`,
      cmig
    );
    writeFile(`${path}/${district.code}/cities-municipalities.json`, cmig);

    //subMunicipalities
    const smig = R.filter(
      R.propEq("districtCode", district.code),
      subMunicipalities
    );
    writeFile(`${path}/${district.code}/sub-municipalities/index.html`, smig);
    writeFile(`${path}/${district.code}/sub-municipalities.json`, smig);

    //barangays
    const big = R.filter(R.propEq("districtCode", district.code), barangays);
    writeFile(`${path}/${district.code}/barangays/index.html`, big);
    writeFile(`${path}/${district.code}/barangays.json`, big);
  }, districts);
})();
console.log("Done...");

console.log("Writing Cities...");
(() => {
  const path = "public/cities";

  //default
  writeFile(`${path}/index.html`, cities);
  writeFile(`${path}.json`, cities);

  R.map((city) => {
    //single
    const sig = R.head(R.filter(R.propEq("code", city.code), cities));
    writeFile(`${path}/${city.code}/index.html`, sig);
    writeFile(`${path}/${city.code}.json`, sig);

    //barangays
    const big = R.filter(R.propEq("cityCode", city.code), barangays);
    writeFile(`${path}/${city.code}/barangays/index.html`, big);
    writeFile(`${path}/${city.code}/barangays.json`, big);
  }, cities);
})();
console.log("Done...");

console.log("Writing Municipalities...");
(() => {
  const path = "public/municipalities";

  //default
  writeFile(`${path}/index.html`, municipalities);
  writeFile(`${path}.json`, municipalities);

  R.map((municipality) => {
    //single
    const sig = R.head(
      R.filter(R.propEq("code", municipality.code), municipalities)
    );
    writeFile(`${path}/${municipality.code}/index.html`, sig);
    writeFile(`${path}/${municipality.code}.json`, sig);

    //barangays
    const big = R.filter(
      R.propEq("municipalityCode", municipality.code),
      barangays
    );
    writeFile(`${path}/${municipality.code}/barangays/index.html`, big);
    writeFile(`${path}/${municipality.code}/barangays.json`, big);
  }, municipalities);
})();
console.log("Done...");

console.log("Writing Cities-Municipalities...");
(() => {
  const path = "public/cities-municipalities";

  //default
  writeFile(`${path}/index.html`, citiesMunicipalities);
  writeFile(`${path}.json`, citiesMunicipalities);

  R.map((cityMunicipality) => {
    //single
    const sig = R.head(
      R.filter(R.propEq("code", cityMunicipality.code), citiesMunicipalities)
    );
    writeFile(`${path}/${cityMunicipality.code}/index.html`, sig);
    writeFile(`${path}/${cityMunicipality.code}.json`, sig);

    //barangays
    const big = R.filter(
      (cm) =>
        cm.cityCode === cityMunicipality.code ||
        cm.municipalityCode === cityMunicipality.code,
      barangays
    );
    writeFile(`${path}/${cityMunicipality.code}/barangays/index.html`, big);
    writeFile(`${path}/${cityMunicipality.code}/barangays.json`, big);
  }, citiesMunicipalities);
})();
console.log("Done...");

console.log("Writing Sub-Municipality...");
(() => {
  const path = "public/sub-municipalities";

  //default
  writeFile(`${path}/index.html`, subMunicipalities);
  writeFile(`${path}.json`, subMunicipalities);

  R.map((subMunicipality) => {
    //single
    const sig = R.head(
      R.filter(R.propEq("code", subMunicipality.code), subMunicipalities)
    );
    writeFile(`${path}/${subMunicipality.code}/index.html`, sig);
    writeFile(`${path}/${subMunicipality.code}.json`, sig);

    //barangays
    const big = R.filter(
      R.propEq("subMunicipalityCode", subMunicipality.code),
      barangays
    );
    writeFile(`${path}/${subMunicipality.code}/barangays/index.html`, big);
    writeFile(`${path}/${subMunicipality.code}/barangays.json`, big);
  }, subMunicipalities);
})();
console.log("Done...");

console.log("Writing Barangays...");
(() => {
  const path = "public/barangays";

  //default
  writeFile(`${path}/index.html`, barangays);
  writeFile(`${path}.json`, barangays);

  Promise.all(
    R.map((barangay) => {
      //single
      const sig = R.head(R.filter(R.propEq("code", barangay.code), barangays));
      writeFile(`${path}/${barangay.code}/index.html`, sig);
      writeFile(`${path}/${barangay.code}.json`, sig);
    }, barangays)
  );
})();
console.log("Done...");
