// const data = require('./testdata');
const data = require("./data");
// const successList = require('./successNumberList.json');
const fetch = require("node-fetch");
const fs = require("fs");
const asyncPool = require("tiny-async-pool");

console.log("hello darkhan us");

const start = async function () {
  let total = data.length;
  let sendable = 0;

  let successNumberCount = 0;
  let successNumberList = [];

  let failedNumberCount = 0;
  let failedNumberList = [];
  let mobiCount = 0;

  const allowedAmount = 1000;

  // calc total number
  const newData = data.filter((entry) => parseFloat(entry.TOTALPRICE) >= allowedAmount && !isEmpty(entry.CUSTOMERPHONE));
  total = newData.length;
  console.log(total);
  return;

  // newData.forEach(entry => {
  //   if(
  //     !isEmpty(entry.CUSTOMERPHONE) &&
  //     `${entry.CUSTOMERPHONE}`.match("^[8-9]{1}[0-9]{7}$") &&
  //     parseFloat(entry.TOTALPRICE) >= allowedAmount
  //   ){

  //     console.log(true);
  //   } else {
  //     console.log(`phone: ${entry.CUSTOMERPHONE}`, `total : ${parseFloat(entry.TOTALPRICE)}`);
  //   }
  // });
  // console.log(total);
  // return;

};

const sendSms = async function (body) {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiQURNSU5JU1RSQVRPUiIsInNlc3Npb25faWQiOiJlSFhfYnVRWkhxNUFPa2pfN3oyMEduWU1xUUF3ZTlPOCIsImlhdCI6MTY0Nzk0MTkyNCwiZXhwIjozMjk1OTcwMjQ4fQ.35b8OAjBYbBdElaDzpMS-QFeYbBWcHUnXMjqMFFo0VY";
    const header = new fetch.Headers();
    header.append("Content-Type", "application/json");
    header.append("Authorization", `Bearer ${token}`);

    const options = {
      method: "POST",
      headers: header,
      body: JSON.stringify(body),
      redirect: "follow",
    };

    const response = await fetch("https://sandbox-customer.qpay.mn/v2/darkhanus/sms", options);
    return response.status == 200;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getMobileOperatorName = function (phoneNumber) {
  let strRet = "";
  let phone_prefix = phoneNumber.substring(0, 2);

  switch (phone_prefix) {
    case "99":
    case "95":
    case "94":
    case "85":
      strRet = "Mobicom";
      break;
    case "89":
    case "88":
    case "86":
    case "80":
    case "83":
    case "84":
      strRet = "Unitel";
      break;
    case "96":
    case "91":
    case "90":
    case "92":
      strRet = "Skytel";
      break;
    case "98":
    case "97":
    case "93":
      strRet = "GMobile";
      break;
    default:
      strRet = "Unknown";
      break;
  }

  return strRet;
};

function isEmpty(str) {
  return !str || str.length === 0;
}

start();
