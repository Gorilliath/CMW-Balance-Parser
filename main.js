const { EOL } = require("os");
const fs = require("fs");
const glob = require("glob");
const stringify = require("csv-stringify/lib/sync");
const yargs = require("yargs");


// Parse commandline arguments
const argv = yargs
    .option("help", {
        alias: "h",
        description: "Show help"
    })
    .option("version", {
        alias: "v",
        description: "Show version number"
    })
    .option("target", {
        alias: "t",
        description: "Target folder to parse from ../Src/ directory (case-sensitive)",
        type: "string",
        default: "AOC"
    })
    .option("minDrain", {
        alias: "min",
        description: "Actual calculated stamina drain lowerbound - CalculateParryDamage() Clamp()",
        type: "number",
        default: "8"
    })
    .option("maxDrain", {
        alias: "max",
        description: "Actual calculated stamina drain upperbound - CalculateParryDamage() Clamp()",
        type: "number",
        default: "25"
    })
    .parse(process.argv);


function parseProperty (property, lines) {

    // UnrealScript is case-insensitive
    property = property.toLowerCase();

    for (let line of lines) {

        if (line.toLowerCase().includes(property)) {

            let value = line
                .slice(line.indexOf("=") + 1)   // Everything after "="
                .trim();                        // Trim trailing and leading whitespace

            // Deal with semicolon if it's present
            if (value.endsWith(";"))
                value = value.slice(-1).trim();

            return value;

        }

    }

    return `Failed to parse '${property}'`;

};

function getColumnLetterFromIndex (index) {
    let x = Math.floor(index / 26);
    return x >= 0 ? getColumnLetterFromIndex(x - 1) + String.fromCharCode(65 + (index % 26)) : "";
};


// Match weapon files
let weaponFilepaths = glob.sync(`../Src/${argv.target}/**/*[Ww]eapon_*.uc`);

// Parse desired properties from each weapon and dump into an array
let weapons = [];
for (let filepath of weaponFilepaths) {

    // Determine weapon name
    let name = filepath
        .slice(filepath.indexOf("_") + 1, filepath.indexOf(".uc"))  // Everything inbetween "_" and ".uc"
        .trim();

    // Read all lines of the file and dump into an array
    let lines = fs.readFileSync(filepath, { encoding: "utf-8" }).split(EOL);

    // Reverse the array (properties are typically located at the bottom of the file, and the last definition of a property is the one we want)
    lines = lines.reverse();

    // Parse desired properties
    let parryNegation = parseProperty("fParryNegation", lines)
      , swingDrain = parseProperty("ParryDrain(0)", lines)
      , overheadDrain = parseProperty("ParryDrain(1)", lines)
      , stabDrain = parseProperty("ParryDrain(2)", lines);

    // Push to weapons array
    weapons.push({
        name,
        parryNegation,
        swingDrain,
        overheadDrain,
        stabDrain
    });

};


// Filter out any weapons which have a property which failed to parse
weapons = weapons.filter( weapon =>
    !(
        weapon.parryNegation.includes("Failed") ||
        weapon.swingDrain.includes("Failed") ||
        weapon.overheadDrain.includes("Failed") ||
        weapon.stabDrain.includes("Failed")
    )
);


// Prepare spreadsheet data
let spreadsheet = [
    [  "Defending Weapon",   "Parry Negation",   "Attacking Weapon"  ],
    [  "",                   "",                 "Attack Type"       ],
    [  "",                   "",                 "Stamina Drain"     ]
];

// Extend spreadsheet with weapon data
for (let weapon of weapons) {

    // Complete headers with each weapon and each of their attacks' stamina drain
    spreadsheet[0].push(weapon.name, "", "");
    spreadsheet[1].push("Swing", "Overhead", "Stab");
    spreadsheet[2].push(weapon.swingDrain, weapon.overheadDrain, weapon.stabDrain);

    // Add rows with each weapon and their parry negation
    spreadsheet.push([ weapon.name, weapon.parryNegation ]);

}

// Complete spreadsheet by adding in formula to resolve actual stamina drain in each matchup
// For each weapon row
for (let y = 3; y < spreadsheet.length; y++) {

    // Resolve spreadsheet's row number
    let rowNumber = y + 1;

    // Resolve parry negation cell (column doesn't change)
    let parryNegationCell = `B${rowNumber}`;

    // For each weapon's attacks' stamina drain in header
    for (let x = 3; x < spreadsheet[2].length; x++) {

        // Resolve spreadsheet's column letter
        let columnLetter = getColumnLetterFromIndex(x);

        // Resolve stamina drain cell (row doesn't change)
        let staminaDrainCell = `${columnLetter}3`;

        // Resolve spreadsheet formula
        spreadsheet[y][x] = `=MIN(MAX(${staminaDrainCell}-${parryNegationCell}, ${argv.minDrain}), ${argv.maxDrain})`;

    }

}

// Convert spreadsheet data to CSV string
const csvString = stringify(spreadsheet);

// Ensure output directory exists
if (!fs.existsSync("./output"))
    fs.mkdirSync("./output");

// Write to file (will overwrite if the file already exists)
fs.writeFileSync(`./output/${argv.target}.csv`, csvString);
console.log(`Wrote to ./output/${argv.target}.csv`);
