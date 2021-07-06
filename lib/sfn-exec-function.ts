import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { StateMachine } from '@aws-cdk/aws-stepfunctions';

export interface SfnExecFunctionProps {
  readonly stateMachine: StateMachine
}

export class SfnExecFunction extends cdk.Construct {

  public integration: LambdaProxyIntegration;

  constructor(scope: cdk.Construct, id: string, props: SfnExecFunctionProps) {

    super(scope, id);

    const lambdaFunction = new NodejsFunction(this, 'lambda', {
      environment: {
        stateMachineArn: props.stateMachine.stateMachineArn
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    this.integration = new LambdaProxyIntegration({ handler: lambdaFunction });

    props.stateMachine.grantStartExecution(lambdaFunction.role!)

  }

}