import fs from "fs";
import axios from "axios";
import inquirer from "inquirer";
import express from "express";
import chalk from "chalk";
import chalk_animation from "chalk-animation";
import path from "path";
let myData = [];
let allData = [];
let id = [];
let allId = [];
let allServerData = [];
let answer1;
let selectedCoin;
var coinData;

//sleep function for wait for a function
const sleep = (ms = 2000) => new Promise((res) => setTimeout(res, ms));

//hello function for say "WELCOME!!!"
await hello();
async function hello() {
  const hello = chalk_animation.rainbow(`                               
  #            #   # # # #   #         # # # #    # # # #     #       #   # # # #   # #  # #  # #
   #    # #    #   #         #        #          #       #    # #   # #   #         # #  # #  # #
    #   #  #  #    # # #     #       #          #         #   #  # #  #   # # #     # #  # #  # #
     # #    # #    #         #        #          #       #    #   #   #   #                
      #      #     # # # #   # # # #   # # # #    #  #  #     #       #   # # # #    #    #    #
  `);
  await sleep();
  hello.stop();
}

 await checkDataExists();

//check if data exists in cache file take it or get it  from API
async function checkDataExists() {
  fs.readFile("./cache/coins.json", function (err, data) {
    if (err) {
      return console.error(err);
    }
    if (data.length == 0) {
      getItem();
    } else {
      let jsonData = JSON.parse(data);

      jsonData.forEach((element) => {
        allId.push(element.id);
        allData.push(element);
        let countOfId = 0;
        if (countOfId < 30) {
          id.push(element.id);
          myData.push(element);
        }
      });
    }
  });
}

//first question
inquirer
  .prompt([
    {
      name: "select",
      message: `${chalk.blue("What do you want?")}`,
      type: "list",
      choices: ["Show list", "Start server"],
    },
  ])
  .then((answers) => {
    answer1 = answers.select;
    console.log(answer1);
    //second question (show list)
    if (answer1 == "Show list") {
      inquirer
        .prompt([
          {
            name: "userChoice",
            message: `${chalk.blue("Which coin you looking for")}?`,
            type: "list",
            choices: id,
          },
        ])
        .then((answers) => {
          selectedCoin = answers.userChoice;
          //check directory if it exists read it else create new directory
          if (fs.existsSync(`./cache/market-charts/${selectedCoin}`)) {
            fs.readdirSync(`./cache/market-charts/${selectedCoin}`).length === 0
              ? aboutCoin(selectedCoin)
              : readDataFromFile(selectedCoin);
          } else {
            fs.mkdir(
              path.join("cache", "market-charts", `${selectedCoin}`),
              (err) => {
                if (err) console.log(err);
              }
            );
            aboutCoin(selectedCoin);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      //start server
      inquirer
        .prompt([
          {
            name: "userChoice",
            message: "Select a coin",
            type: "list",
            choices: allId,
          },
        ])
        .then((answers) => {
          selectedCoin = answers.userChoice;
          if (fs.existsSync(`./cache/market-charts/${selectedCoin}`)) {
            fs.readdirSync(`./cache/market-charts/${selectedCoin}`).length === 0
              ? aboutCoin(selectedCoin)
              : readDataFromFile(selectedCoin);
            server(selectedCoin);
          } else {
            fs.mkdirSync(
              path.join("cache", "market-charts", `${selectedCoin}`),
              (err) => {
                if (err) throw err;
              }
            );
            aboutCoin(selectedCoin);
            server(selectedCoin);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  })
  .catch((error) => {
    console.log(error);
  });

//get coins' data
async function getItem() {
  await axios
    .get("https://api.coingecko.com/api/v3/coins/list")
    .then((res) => res.data)
    .then(function (data) {
      //take only 30 data
      for (let i = 0; i < 30; i++) {
        let obj = {
          id: data[i].id,
          name: data[i].name,
          symbol: data[i].symbol,
        };
        myData.push(obj);
        id.push(data[i].id);
      }

      //take all data
      for (let i = 0; i < data.length; i++) {
        let obj = {
          id: data[i].id,
          name: data[i].name,
          symbol: data[i].symbol,
        };
        allData.push(JSON.stringify(obj));
        allId.push(data[i].id);

        //write data to cache file
        let myDataJson = JSON.stringify(myData);
        fs.writeFileSync("./cache/coins.json", myDataJson, (err) => {
          if (err) throw err;
        });
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

//get coin's information
async function aboutCoin(coin) {
  coinData = await axios
    .get(
      `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=max`
    )
    .then((res) => res)
    .catch((err) => console.log(err));
  coinData = JSON.stringify(coinData.data);
  allServerData.push(coinData);
  console.log(JSON.parse(coinData));
  writeDataToFile(coin, coinData);
}
//create server and sent all data about a selected coin
function server(coin) {
  const app = express();
  const port = 3000;
  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const html = `
    All data about ${coin}
    _______________________________________________________________________________________________________________________________________________________________________________________________________                                                                       


      ${allServerData}
    `;
    res.send(html);
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}
//if directory exists read data from there
function readDataFromFile(coin) {
  let allDataAboutCoin = fs.readdirSync(`./cache/market-charts/${coin}`);
  let data = JSON.parse(
    fs.readFileSync(
      path.join(
        "cache",
        "market-charts",
        `${coin}`,
        `${allDataAboutCoin[allDataAboutCoin.length - 1]}`
      )
    )
  );
  allServerData = data;
  console.log(data);
}
// if directory is empty then program come here and write file here
function writeDataToFile(coin, data) {
  let date = new Date();
  date = date.toISOString();
  date = date.split(":").join("_");
  date = date.split("-").join("_");
  date = date.split(".").join("_");
  fs.writeFileSync(
    path.join("cache", "market-charts", `${coin}`, `${date}.json`),
    data
  );
}
