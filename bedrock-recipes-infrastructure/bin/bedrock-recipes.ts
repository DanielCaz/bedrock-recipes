#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BedrockRecipesStack } from "../lib/bedrock-recipes-stack";

const app = new cdk.App();
new BedrockRecipesStack(app, "BedrockRecipesStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
