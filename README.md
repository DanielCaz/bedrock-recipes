# Bedrock Recipe Generator

A full-stack project for generating recipes using AWS Bedrock and modern web technologies.

## Overview

This repository contains two main components:

- **bedrock-recipes-infrastructure**: AWS CDK (TypeScript) project that provisions all required cloud resources, including Lambda functions, API Gateway (WebSocket), Step Functions, and S3 buckets.
- **bedrock-recipes-frontend**: A modern React application scaffolded with Vite, TypeScript, and Tailwind CSS, providing a user-friendly interface for interacting with the backend.

## Infrastructure

Located in `bedrock-recipes-infrastructure/`, this CDK app defines and deploys:

- Lambda functions for recipe and image generation
- WebSocket API for real-time communication
- Step Functions state machine for orchestration
- S3 bucket for storing generated images
- All necessary IAM roles and policies

### Getting Started

1. Install dependencies:

   ```bash
   cd bedrock-recipes-infrastructure
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

## Frontend

Located in `bedrock-recipes-frontend/`, this is a Vite + React + TypeScript app with Tailwind CSS and TanStack Router.

### Features

- Modern React setup with opinionated defaults
- Tailwind CSS and Prettier integration
- Shadcn UI components for a consistent design
- VS Code recommended settings

### Getting Started

1. Install dependencies:

   ```bash
   cd bedrock-recipes-frontend
   bun install
   ```

2. Start the development server:

   ```bash
   bun dev
   ```
