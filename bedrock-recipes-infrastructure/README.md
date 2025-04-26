# Bedrock Recipes Infrastructure

This project contains the AWS CDK (TypeScript) infrastructure for the Bedrock Recipe Generator application.

## Overview

This CDK app provisions all required AWS resources for the backend, including:

- **Lambda functions** for recipe and image generation using Amazon Bedrock models.
- **WebSocket API Gateway** for real-time client communication.
- **Step Functions state machine** to orchestrate recipe and image generation.
- **S3 bucket** for storing generated images.
- **IAM roles and policies** for secure access.

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Install AWS CDK globally (if not already done):

   ```bash
   pnpm add -g aws-cdk
   ```

3. Bootstrap your AWS environment (if not already done):

   ```bash
   cdk bootstrap
   ```

4. Deploy the stack:
   ```bash
   cdk deploy
   ```

## Useful Commands

- `pnpm run build` – Compile TypeScript to JavaScript
- `pnpm run watch` – Watch for changes and recompile
- `pnpm run test` – Run unit tests with Jest
- `cdk synth` – Synthesize the CloudFormation template
- `cdk diff` – Compare deployed stack with current state

## Project Structure

- `bin/` – Entry point for the CDK app
- `lib/` – Main stack and resource definitions
- `lambda/` – Lambda function source code
- `state-machine/` – Step Functions definitions
- `test/` – Unit tests
