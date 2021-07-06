import * as sfn from '@aws-cdk/aws-stepfunctions';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { RetentionDays } from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import { LambdaInvoke } from '@aws-cdk/aws-stepfunctions-tasks';
import { Duration } from '@aws-cdk/core';

export interface LoadTesterProps {
  readonly routes: string[],
  readonly prefix: string
}

export class LoadTester extends cdk.Construct {

  public stateMachine: sfn.StateMachine;

  constructor(scope: cdk.Construct, id: string, props: LoadTesterProps) {
    super(scope, id);

    const startFunction = new NodejsFunction(this, 'start', {
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    const startJob = new LambdaInvoke(this, 'Start Job', {
      lambdaFunction: startFunction,
      outputPath: '$.Payload'
    });

    const requestFunction = new NodejsFunction(this, 'request', {
      environment: {
        'prefix': props.prefix,
        'routes': props.routes.join(',')
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    const requestJob = new LambdaInvoke(this, 'Request Job', {
      lambdaFunction: requestFunction,
      outputPath: '$.Payload'
    });

    const definition = startJob
      .next(new sfn.Map(this, 'Requesters', {
        itemsPath: '$.Items',
        maxConcurrency: 10
      }).iterator(requestJob))
      .next(new sfn.Succeed(this, 'Success'));

    this.stateMachine = new sfn.StateMachine(this, 'LoadTesterStateMachine', {
      definition,
      timeout: Duration.minutes(5)
    });

  }
}