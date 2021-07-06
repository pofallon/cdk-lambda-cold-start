import * as AWS from 'aws-sdk';

var stepFunctions = new AWS.StepFunctions();

const handler = async (event: any) => {

  console.log(process.env);
  console.log(event);

  await stepFunctions.startExecution({
    stateMachineArn: process.env.stateMachineArn!,
    input: "{\"count\" : 5}"
  }).promise()

  return {
    statusCode: 200
  }

}

export { handler }