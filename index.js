// const data = require('./testdata');
const data = require("./data");
const fetch = require("node-fetch");
const fs = require("fs"); 
const asyncPool = require("tiny-async-pool");

console.log("hello darkhan us");
// https://www.convertjson.com/xml-to-json.htm
//https://www.convertcsv.com/json-to-csv.htm

String.prototype.padZero= function(len, c){
  var s= this, c= c || '0';
  if(len <= s.length) return this;
  while(s.length< len) s= c+ s;
  return s;
}

var dt = new Date();
var month = ('0' + (dt.getMonth() + 1)).slice(-2);
var day = ('0' + dt.getDate()).slice(-2);
const date = `${dt.getFullYear()}${month}${day}`;


const genInvoiceNumber = (num) => date +`${num}`.padZero(5);

const start = async function () {
  let total = data.length;
  let totalSendable = 0;
  let generatedInvoiceCount = 0;

  let successNumberCount = 0;
  let successNumberList = [];

  let failedNumberCount = 0;
  let failedNumberList = [];

  const allowedAmount = 10000;

  // calc total number
  
  const dataList = data.filter((entry) => (
    !isEmpty(`${entry.CUSTOMERPHONE}`) &&
    `${entry.CUSTOMERPHONE}`.match("^[8-9]{1}[0-9]{7}$") &&
    parseFloat(entry.TOTALPRICE) >= allowedAmount
  ));

  totalSendable = dataList.length;

 

  await asyncPool(1, dataList, async (entry) => {
    try { 
      const invoiceId = genInvoiceNumber(dataList.indexOf(entry) + 1);
      let result = await createInvoice({
        customer_code: entry.CUSCODE,
        branch_name: entry.BRANCHNAME,
        invoice_id :invoiceId,
        invoice_date: dt.toISOString(),
        invoice_description: entry.CALCMONTH + " төлбөр",
        total_price: parseFloat(entry.TOTALPRICE).toFixed(2),
      });

      try {
        result = JSON.parse(result);
      } catch (err) {
        console.log("CUSCODE: ", entry.CUSCODE);
        console.log("RESULT", result);

        failedNumberCount++;
        failedNumberList.push({
          phoneNumber: `${entry.CUSTOMERPHONE}`,
          customer_no: entry.CUSCODE,
          operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
          error: `error_invoice_creating: ${JSON.stringify(result)}`,
        });
        return;
      }

      if (result.result_code == 0) {
        generatedInvoiceCount++;

        // const rawMessage = [
        //   "Darhan-Us",
        //   "Kod: " + entry.CUSCODE,
        //   entry.CALCMONTH + " sar tulbur: " + parseFloat(entry.MONTHPRICE).toFixed(2) + " tug",
        //   "Toloh dun: " + parseFloat(entry.TOTALPRICE).toFixed(2) + " tug",
        //   "Xaan 5045052676",
        //   "Tur 140800003249",
        //   result.json_data.qPay_shortUrl,
        // ];

        const rawMessage = [
          "DUS HK",
          "Kod:" + entry.CUSCODE,
          "Tulbur:" + parseFloat(entry.TOTALPRICE).toFixed(0) + "tug",
          "2022.06.29nii dotor tulnu vv!",
          "tulugdugvi tohioldold US HYZGAARLAH bolohiig medegdey!",
          result.json_data.qPay_shortUrl,
        ];

        const message = rawMessage.join("\n");

        if (message.length > 160) {
          return failedNumberList.push({
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            customer_no: entry.CUSCODE,
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
            invoiceNo : invoiceId,
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
            message: message,
          });
           console.log('sent ',successNumberCount, '/' , totalSendable);
        } else {
          failedNumberCount++;
          failedNumberList.push({
            phoneNumber: `${entry.CUSTOMERPHONE}`,
            customer_no: entry.CUSCODE,
            operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
            message: message,
            error: `sms_send_error: ${JSON.stringify(smsResult)}`,
          });
        }
      } else {
        failedNumberCount++;
        failedNumberList.push({
          phoneNumber: `${entry.CUSTOMERPHONE}`,
          customer_no: entry.CUSCODE,
          operator: getMobileOperatorName(`${entry.CUSTOMERPHONE}`),
          error: `error_invoice_creating: ${JSON.stringify(result)}`,
        });
        console.log("Error:" + result.ret_type, result.response.result_msg);
      }
    } catch (err) {
      console.log(err);
    }
  });

  fs.writeFileSync("successNumberList.json", JSON.stringify(successNumberList));
  fs.writeFileSync("failedNumberList.json", JSON.stringify(failedNumberList));

  console.log("total", total);
  console.log("total sendable", totalSendable);
  console.log("generatedInvoiceCount", generatedInvoiceCount);
  console.log("successNumberCount", successNumberCount);
  console.log("failedNumberCount", failedNumberCount);
};

const createInvoice = async function (data) {
  const { customer_code, branch_name, invoice_id, invoice_date, invoice_description, total_price } = data;

  const invoice_code = "DARKHAN_US_INVOICE";
  const merchant_code = "DARKHAN_US";
  const merchant_verification_code = "aghs2tB4jU3yVY3p";

  const gen_invoice = {
    invoice_code: invoice_code,
    merchant_branch_code: branch_name,
    merchant_invoice_number: invoice_id,
    invoice_date: invoice_date,
    invoice_description: invoice_description,
    invoice_total_discounts: "",
    invoice_total_surcharges: "",
    invoice_gross_amount: parseFloat((total_price * 10) / 11)
      .toFixed(2)
      .toString(),
    invoice_total_taxes: parseFloat(total_price / 11)
      .toFixed(2)
      .toString(),
    invoice_total_amount: total_price.toString(),
    invoice_currency_code: "MNT",
    invoice_lines: [
      {
        invoice_line_number: "1",
        item_btuk_code: "6921000",
        merchant_item_code: "",
        invoice_line_description: invoice_description,
        invoice_line_quantity: "1",
        invoice_line_unit_price: parseFloat((total_price * 10) / 11)
          .toFixed(2)
          .toString(),
        invoice_line_discounts: "",
        invoice_line_surcharges: "",
        invoice_line_taxes: parseFloat(total_price / 11)
          .toFixed(2)
          .toString(),
        invoice_line_amount: total_price.toString(),
        invoice_line_currency_code: "MNT",
      },
    ],
    invoice_taxes: [
      {
        invoice_line_number: "1",
        tax_code: "VAT",
        tax_type: "VAT",
        tax_amount: parseFloat(total_price / 11)
          .toFixed(2)
          .toString(),
        tax_description: "НӨАТ",
      },
    ],
  };

  const result = await postRequest({
    type: "5",
    merchant_code,
    merchant_verification_code,
    merchant_customer_code: customer_code,
    json_data: gen_invoice,
  });

  return result;
};

const postRequest = async function (data) {
  const username = "qpay_darkhan_us";
  const password = "htN4VC2E";
  const base64 = Buffer.from(`${username}:${password}`).toString("base64");
  const myHeaders = new fetch.Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Basic ${base64}`);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(data),
    redirect: "follow",
  };

  const response = await fetch("https://api.qpay.mn/v0/invoice/gen", requestOptions);
  return response.text();
};

const sendSms = async function (body) {
   try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiQURNSU5JU1RSQVRPUiIsInNlc3Npb25faWQiOiJDTEtfa1BMN1p6bVhvQ3o2UTh3UUpjS2ttTlNmNUkxeiIsImlhdCI6MTY1NjQwOTcwNSwiZXhwIjozMzEyOTA1ODEwfQ.BSQE8V6hJhs64OV7adUYMpCimgTZ1LZKE7NXkEM_Lhk";
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
