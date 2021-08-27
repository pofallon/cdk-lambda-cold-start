import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { DockerImageFunction, DockerImageCode, Runtime, LayerVersion } from '@aws-cdk/aws-lambda';
import { PythonFunction } from '@aws-cdk/aws-lambda-python';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { SfnExecFunction } from './sfn-exec-function';
import { LoadTester } from './load-tester';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

const insightsLayerArn = `arn:aws:lambda:${process.env.CDK_DEFAULT_REGION}:580247275435:layer:LambdaInsightsExtension:14`;

export class LambdaColdStartStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, 'HttpApi');

    const dotNet5Function = new DockerImageFunction(this, 'DotNet5Container', {
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '..', 'src', 'dotnet5-container')),
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    dotNet5Function.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'))
    const dotNet5Integration = new LambdaProxyIntegration({ handler: dotNet5Function });
    httpApi.addRoutes({ path: '/dotnet5-container', methods: [ HttpMethod.GET ], integration: dotNet5Integration });

    const python3Function = new PythonFunction(this, 'Python3Function', {
      entry: path.join(__dirname, '..', 'src', 'python3'),  
      index: 'function.py',
      handler: 'lambda_handler',
      runtime: Runtime.PYTHON_3_7,
      layers: [ LayerVersion.fromLayerVersionArn(this, 'LayerFromArn', insightsLayerArn) ],
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
    python3Function.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'))
    
    const python3Integration = new LambdaProxyIntegration({ handler: python3Function });
    httpApi.addRoutes({ path: '/python3', methods: [ HttpMethod.GET ], integration: python3Integration })

    const loadTester = new LoadTester(this, 'LoadTester', {
      routes: ['dotnet5-container', 'python3'],
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
