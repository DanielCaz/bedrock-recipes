import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as apigwv2Integrations,
  aws_stepfunctions as sfn,
  aws_iam as iam,
  aws_s3 as s3,
  aws_s3_deployment as s3Deploy,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cfOrigins,
} from "aws-cdk-lib";
import { ccloud_lambda } from "@compucloud-mx/ccloud-cdk-lib";

export class BedrockRecipesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createWebDeployment();

    const { lambdaRouteSendMessage, webSocketApiStage, webSocketApiUrl } =
      this.createWebSocketApi();

    const bucketImages = this.createImagesBucket();

    const lambdaGenerateRecipe =
      this.createGenerateRecipeLambda(webSocketApiUrl);
    const lambdaGenerateImage = this.createGenerateImageLambda(
      webSocketApiUrl,
      bucketImages
    );

    const stateMachine = this.createStateMachine(
      lambdaGenerateRecipe,
      lambdaGenerateImage
    );

    lambdaRouteSendMessage.addEnvironment(
      "STATE_MACHINE_ARN",
      stateMachine.stateMachineArn
    );

    stateMachine.grantStartExecution(lambdaRouteSendMessage);
    lambdaGenerateRecipe.grantInvoke(stateMachine);
    lambdaGenerateImage.grantInvoke(stateMachine);
    webSocketApiStage.grantManagementApiAccess(lambdaGenerateRecipe);
    webSocketApiStage.grantManagementApiAccess(lambdaGenerateImage);
    bucketImages.grantWrite(lambdaGenerateImage);
  }

  private createImagesBucket() {
    const bucket = new s3.Bucket(this, "images-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      },
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ["*"],
        },
      ],
    });
    bucket.grantPublicAccess();
    return bucket;
  }

  private createGenerateRecipeLambda(webSocketApiUrl: string) {
    return new ccloud_lambda.Function(this, "generate-recipe-lambda", {
      codePath: "lambda/functions/generate_recipe",
      powertoolsLayerVersion: 13,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      environment: {
        MODEL_ID: "amazon.nova-lite-v1:0",
        WEBSOCKET_ENDPOINT: webSocketApiUrl,
      },
      iamPolicy: [
        {
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:InvokeModelWithResponseStream"],
          resources: [
            `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
          ],
        },
      ],
    }).function;
  }

  private createGenerateImageLambda(
    webSocketApiUrl: string,
    bucketImages: s3.Bucket
  ) {
    return new ccloud_lambda.Function(this, "generate-image-lambda", {
      codePath: "lambda/functions/generate_image",
      powertoolsLayerVersion: 13,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      environment: {
        WEBSOCKET_ENDPOINT: webSocketApiUrl,
        MODEL_ID: "amazon.nova-canvas-v1:0",
        BUCKET_NAME: bucketImages.bucketName,
      },
      iamPolicy: [
        {
          effect: iam.Effect.ALLOW,
          actions: ["bedrock:InvokeModel"],
          resources: [
            `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-canvas-v1:0`,
          ],
        },
      ],
    }).function;
  }

  private createStateMachine(
    lambdaGenerateRecipe: any,
    lambdaGenerateImage: any
  ) {
    return new sfn.StateMachine(this, "state-machine", {
      tracingEnabled: true,
      definitionBody: sfn.DefinitionBody.fromFile(
        "state-machine/recipe-state-machine.asl.yaml"
      ),
      definitionSubstitutions: {
        lambda_generate_recipe: lambdaGenerateRecipe.functionArn,
        lambda_generate_image: lambdaGenerateImage.functionArn,
      },
    });
  }

  private createWebSocketApi() {
    const webSocketApi = new apigwv2.WebSocketApi(this, "web-socket-api");

    const { function: lambdaRouteSendMessage } = new ccloud_lambda.Function(
      this,
      "web-socket-send-message-lambda",
      {
        codePath: "lambda/functions/ws_message",
        powertoolsLayerVersion: 13,
        memorySize: 1024,
        timeout: cdk.Duration.minutes(15),
      }
    );

    webSocketApi.addRoute("message", {
      integration: new apigwv2Integrations.WebSocketLambdaIntegration(
        "send-message-integration",
        lambdaRouteSendMessage
      ),
    });

    const webSocketApiStage = new apigwv2.WebSocketStage(
      this,
      "web-socket-stage",
      {
        webSocketApi,
        stageName: "prod",
        autoDeploy: true,
      }
    );

    webSocketApiStage.grantManagementApiAccess(lambdaRouteSendMessage);

    const webSocketApiUrl = `https://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketApiStage.stageName}`;

    lambdaRouteSendMessage.addEnvironment(
      "WEBSOCKET_ENDPOINT",
      webSocketApiUrl
    );

    new cdk.CfnOutput(this, "web-socket-api-endpoint", {
      value: `${webSocketApi.apiEndpoint}/${webSocketApiStage.stageName}`,
      description: "WebSocket API Endpoint",
    });

    return {
      lambdaRouteSendMessage,
      webSocketApiStage,
      webSocketApiUrl,
    };
  }

  private createWebDeployment() {
    const bucket = new s3.Bucket(this, "web-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, "web-distribution", {
      defaultBehavior: {
        origin: cfOrigins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    new s3Deploy.BucketDeployment(this, "deploy-web", {
      sources: [s3Deploy.Source.asset("../bedrock-recipes-frontend/dist")],
      destinationBucket: bucket,
      distribution: distribution,
    });

    new cdk.CfnOutput(this, "web-distribution-url", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Web Distribution URL",
    });
  }
}
