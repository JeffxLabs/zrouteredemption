"use strict";
// High-confidence rows transcribed from the supplied Today leaderboard screenshots.
window.Leaderboard = {
  captureDate: "2026-08-31",
  screenshotCount: 27,
  rankCoverage: [1, 186],
  jeff: {rank: 22, points: 10066490},
  top: [
    {rank: 1, player: "Eldagrim", alliance: "P1MP", points: 47091808},
    {rank: 2, player: "Vieques", alliance: "P1MP", points: 35303724},
    {rank: 3, player: "TheRequiem", alliance: "P1MP", points: 35256086},
    {rank: 4, player: "JimmyJam", alliance: "P1MP", points: 27318098},
    {rank: 5, player: "RollingStoners", alliance: "P1MP", points: 26959454},
    {rank: 6, player: "AyeGee", alliance: "P1MP", points: 19803198},
    {rank: 7, player: "chauncey", alliance: "P1MP", points: 17913038},
    {rank: 8, player: "bulger", alliance: "ddk", points: 15182804},
    {rank: 9, player: "eastnasty", alliance: "ddk", points: 15017406},
    {rank: 10, player: "СяВаКуль", alliance: "ddk", points: 14918656},
    {rank: 11, player: "Nicocr94", alliance: "ddk", points: 14854716},
    {rank: 12, player: "Fynn1", alliance: "ddk", points: 14250778},
    {rank: 13, player: "PimpinDudes", alliance: "P1MP", points: 13286862},
    {rank: 14, player: "LexXxx", alliance: "ddk", points: 13009504},
    {rank: 15, player: "Boomboomberry", alliance: "P1MP", points: 11852848}
  ]
};
if (Leaderboard.top.length !== 15 || Leaderboard.jeff.rank !== 22) throw new Error("Leaderboard evidence self-check failed");
