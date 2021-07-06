import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { DockerImageFunction, DockerImageCode } from '@aws-cdk/aws-lambda';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { SfnExecFunction } from './sfn-exec-function';
import { LoadTester } from './load-tester';

export class LambdaColdStartStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, 'HttpApi');

    const dotNet5Function = new DockerImageFunction(this, 'DotNet5Container', {
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '..', 'src', 'dotnet5-container')),
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    const dotNet5Integration = new LambdaProxyIntegration({ handler: dotNet5Function });
    httpApi.addRoutes({ path: '/dotnet5-container', methods: [ HttpMethod.GET ], integration: dotNet5Integration });

    const loadTester = new LoadTester(this, 'LoadTester', {
      routes: ['dotnet5-container'],
      prefix: httpApi.apiEndpoint
    });

    const execFunction = new SfnExecFunction(this, 'SfnExecFunction', { stateMachine: loadTester.stateMachine });
    httpApi.addRoutes({ path: '/exec', methods: [HttpMethod.POST], integration: execFunction.integration })

    new cdk.CfnOutput(this, 'ColdStartAPIGatewayEndpoint', {
      description: 'Lambda API Gateway Endpoint',
      exportName: 'lambda-api-gateway-endpoint',
      value: httpApi.apiEndpoint
    });
  }
}
