import os
import json
import boto3

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.data_classes import APIGatewayWebSocketEvent
from aws_lambda_powertools.utilities.typing import LambdaContext

WEBSOCKET_ENDPOINT = os.environ["WEBSOCKET_ENDPOINT"]
STATE_MACHINE_ARN = os.environ["STATE_MACHINE_ARN"]

logger = Logger()
tracer = Tracer()

apigw = boto3.client("apigatewaymanagementapi", endpoint_url=WEBSOCKET_ENDPOINT)
step_functions = boto3.client("stepfunctions")


@tracer.capture_lambda_handler
def lambda_handler(event: APIGatewayWebSocketEvent, context: LambdaContext):
    try:
        connection_id = event["requestContext"]["connectionId"]

        body = json.loads(event["body"])
        if not body:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Invalid request body"}),
            }

        ingredients: str = body.get("ingredients")
        if not ingredients:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing ingredients in request body"}),
            }

        step_functions.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=json.dumps(
                {
                    "connection_id": connection_id,
                    "ingredients": ingredients,
                }
            ),
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Starting generation..."}),
        }
    except KeyError as e:
        logger.error(f"Missing key in event: {e}")
        return {
            "statusCode": 400,
            "body": json.dumps({"message": f"Missing key: {e}"}),
        }
    except Exception as e:
        logger.error(f"Error processing event: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"}),
        }
