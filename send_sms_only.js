// const data = require('./testdata');
const data = require("./data");
// const successList = require('./successNumberList.json');
const fetch = require("node-fetch");
const fs = require("fs");
const asyncPool = require("tiny-async-pool");

console.log("hello darkhan us");

const start = async function () {
  let total = data.length;

  let successNumberCount = 0;
  let successNumberList = [];

  let failedNumberCount = 0;
  let failedNumberList = [];

  const allowedAmount = 10000;

  // calc total number
  const newData = data.filter((entry) => parseFloat(entry.TOTALPRICE) >= allowedAmount && !isEmpty(entry.CUSTOMERPHONE));
  total = newData.length;
  console.log(total);

  await asyncPool(1, newData, async (entry) => {
    try {
        const rawMessage = [
          `DUS HK kod:${entry.CUSNUMBER} tulbur-${parseFloat(entry.TOTALPRICE).toFixed(2)} tug`,
          " Tulburiig 2022.05.27nii dotor tuluugui tohioldold honog tutamd 0,5%-r aldangi tootsoh ba us hyzgaarlahiig medegdey!"
        ];

        const message = rawMessage.join("\n");

        if (message.length > 160) {
          return failedNumberList.push({
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            invoice_id: entry.INVOICEID,
            customer_no: entry.CUSNUMBER,
            operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
            message: message,
            error: `sms_send_error: 160 character overlimit`,
          });
        }

        const smsResult = await sendSms({
          phone_number: `${entry.CUSTOMERPHONE}`,
          message: message,
        });

        if (smsResult == true) {
          successNumberCount++;
          successNumberList.push({
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
            // "invoice_id" : entry.INVOICEID,
            // "customer_no" : entry.CUSNUMBER,
            message: message,
          });
           console.log('sent ',successNumberCount, '/' , total);
        } else {
          failedNumberCount++;
          failedNumberList.push({
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            invoice_id: entry.INVOICEID,
            customer_no: entry.CUSNUMBER,
            operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
            message: message,
            error: `sms_send_error: ${JSON.stringify(smsResult)}`,
          });
        }
    } catch (err) {
      console.log(err);
    }
  });

  fs.writeFileSync("successNumberList.json", JSON.stringify(successNumberList));
  fs.writeFileSync("failedNumberList.json", JSON.stringify(failedNumberList));

  console.log("total", total);
  console.log("successNumberCount", successNumberCount);
  console.log("failedNumberCount", failedNumberCount);

  return;

};

const sendSms = async function (body) {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiQURNSU5JU1RSQVRPUiIsInNlc3Npb25faWQiOiI3NFpXUkxfMVZCSFpWRmVnWW9TZWFaTzhQNUVHWGpZRyIsImlhdCI6MTY1MzYyNjQ5MywiZXhwIjozMzA3MzM5Mzg2fQ.TAo6IWqOzxQe5TS0zIR-PsitaiSG4y3-oCbOGP_z2GI";
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
