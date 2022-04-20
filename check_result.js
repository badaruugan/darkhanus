const result = require("./result");

const start = async function () {
  console.log(result.length);
  const test = result.filter(arguments => {
      return arguments.message.includes('Darhan-Us');
  });
  console.log(test.length);
};

start();
