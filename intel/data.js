"use strict";
(function () {

const makePlayers = rows => rows.map(([rank, name, level, power, role]) => ({rank, name, level, power, role}));

const alliances = {
  p1mp: {
    id: "p1mp", tag: "P1MP", name: "JU1CE", server: 117, relation: "Home alliance",
    leader: "TheRequiem", language: "English", scouted: "Aug 9, 2026 · 6:24 p.m. ET", serverTime: "Aug 9, 2026 · 8:24 p.m.",
    precision: "",
    players: makePlayers([
      ["R5","TheRequiem",24,24.746607],
      ["R4","Jeff",19,11.5,"Butler"],["R4","T83",18,8.4],["R4","Disorder762",23,26.0,"Warlord"],["R4","PettyPimp",20,16.9,"Goddess"],["R4","MacadamiaNut",19,10.2],["R4","CallMeP1MPKamil",21,22.086973],["R4","luckyy",20,17.3],
      ["R3","chauncey",22,25.3],["R3","AyeGee",21,12.4],["R3","SerenaMoon",20,11.5],["R3","LegendTR",19,12.9],["R3","Boomboomberry",19,12.8],["R3","skinnybigpoppa",18,11.9],["R3","GoodBabyGirl",18,11.9],["R3","JoanCornielle",18,11.5],["R3","Chickendog",19,10.8],["R3","vforvendetta",18,11.5],["R3","Librarian",21,20.0],["R3","B3N",19,12.1],["R3","GeekHunter",16,8.0],["R3","Wacker",17,12.1],["R3","Owen6767",20,12.8],["R3","PimpinDudes",20,17.6],["R3","Isab3ll",16,9.6],["R3","JimmyJam",21,26.2],["R3","MrWhiskey",21,19.4],["R3","Mohammad2824",18,10.6],["R3","Luke65",20,20.0],["R3","laggingPotato",16,9.1],["R3","HandStrong",15,8.1],["R3","Eldagrim",23,32.3],["R3","Locianos",17,8.5],["R3","Limps",18,7.7],["R3","DemonKiller",18,8.4],["R3","DLiner75",18,10.8],["R3","Staemmo",17,10.7],["R3","Blockboy5",19,9.3],["R3","Analbrutal",18,9.5],["R3","PreacheR",16,11.0],["R3","DeathReapers",18,10.2],["R3","babeblade",19,5.9],["R3","Sinister-Soul",19,11.4],["R3","Shunter",20,11.6],["R3","dbjack23",17,6.8],["R3","Kpeast",17,5.8],["R3","PimpReaper",18,13.0],["R3","Rhyzup",19,9.4],["R3","Rhyss",18,12.3],["R3","Freaxx99",20,12.7],["R3","Toblinice",18,13.2],["R3","Momof7",18,10.5],["R3","Nando6331",19,9.0],["R3","STEALTH",21,13.7],["R3","Spicy1",19,10.4],["R3","archer339",18,6.6],["R3","알까기",19,15.2],["R3","SupremeDuke",21,13.2],["R3","becerrito123",17,11.2],["R3","HAMMERS",16,8.6],["R3","Id3mo",19,12.7],["R3","TheGreaterGood",18,13.2],["R3","DewaLipan",20,13.8],["R3","Pipocashisha",17,10.5],["R3","Bode",19,11.6],["R3","BOUGE",18,7.0],["R3","lupa1987",15,8.1],["R3","Azumiii",17,5.3],["R3","LumaPR",19,12.3],["R3","Agam0017",20,16.7],
      ["R2","Brody138",19,12.6],["R2","周星星",18,11.8],["R2","FFChucky",18,11.1],["R2","SadSquatch",17,9.2],["R2","KaryLive",17,8.5],["R2","BoredAtWork",20,9.0],["R2","KILLABWOY2002",13,2.7],["R2","DrUpInSmoke",18,7.4],["R2","Nevers54",18,9.2],["R2","Slickback",17,7.6],["R2","Vieques",20,15.2],["R2","Rakna",15,6.7],["R2","-NERO-",18,10.1],["R2","ComandanteMike",15,6.8],["R2","PimpIsDaddy",17,4.2],["R2","XYZ-A",18,10.8],["R2","Redwind",20,6.2],["R2","asiruh09",17,10.2],["R2","Dracolish",17,6.0],["R2","Grandpaowl",18,8.5],["R2","HCultLeader",17,6.3],["R2","dujones",18,10.7],["R2","Skitz0",18,5.1],["R2","CuteCat",18,9.0],["R2","tdoggg",18,7.0],["R2","winterwulf",17,6.5],["R2","ImaV",19,5.0],
      ["R1","ChucklesTheHutt",18,5.5]
    ])
  }
};

const rankOrder = {R1: 1, R2: 2, R3: 3, R4: 4, R5: 5};
const sum = values => values.reduce((total, value) => total + value, 0);
const average = values => sum(values) / values.length;
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
};
const stats = players => ({
  count: players.length,
  total: sum(players.map(player => player.power)),
  average: average(players.map(player => player.power)),
  median: median(players.map(player => player.power)),
  averageLevel: average(players.map(player => player.level)),
  maxLevel: Math.max(...players.map(player => player.level)),
  strongest: [...players].sort((a, b) => b.power - a.power)[0]
});
const formatPower = (value, digits = 2) => `${value.toLocaleString(undefined, {maximumFractionDigits: digits})}M`;
const sortedPlayers = (players, key = "power", descending = true) => [...players].sort((a, b) => {
  const direction = descending ? -1 : 1;
  const difference = key === "name" ? a.name.localeCompare(b.name) : key === "rank" ? rankOrder[a.rank] - rankOrder[b.rank] : a[key] - b[key];
  return direction * difference || a.name.localeCompare(b.name);
});

if (alliances.p1mp.players.length !== 98) {
  throw new Error("Alliance intel data self-check failed");
}

window.Intel = {alliances, rankOrder, stats, formatPower, sortedPlayers, sum};
})();
