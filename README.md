# CMW-Balance-Parser

*this spaghetto is a tool to parse balance values from CMW vanilla/mod source files*  
*(presently just dumps a weapon stam-drain matrix in a spreadsheet)*


## Prerequisites

- [Node and NPM](https://nodejs.org/en/download/)


## Installation

- Clone to `C:\Program Files (x86)\Steam\steamapps\common\chivalrymedievalwarfare\Development`  
- Open a terminal in the project directory that was just created  
- `npm install`

## Usage

Show help on supported arguments  
`node ./main.js -h`

Targetting a mod in ./Development/Src/MySpaghettiMod  
`node ./main.js -t MySpaghettiMod`
