import os
import json
import boto3

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

MODEL_ID = os.environ["MODEL_ID"]
WEBSOCKET_ENDPOINT = os.environ["WEBSOCKET_ENDPOINT"]

logger = Logger()
tracer = Tracer()

bedrock = boto3.client("bedrock-runtime")
apigw = boto3.client("apigatewaymanagementapi", endpoint_url=WEBSOCKET_ENDPOINT)


@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext):
    connection_id: str = event["connection_id"]
    ingredients: str = event["ingredients"]

    bedrock_prompt = f"""\
Task:
Genera una receta de cocina creativa utilizando únicamente los siguientes ingredientes: {ingredients}.

Context information:
- La receta debe ser fácil de seguir y adecuada para cualquier persona.
- No incluyas ingredientes que no estén en la lista proporcionada.
- Si es posible, sugiere una receta tradicional o popular que se adapte a los ingredientes.

Model Instructions:
- Explica los pasos de manera clara y concisa.
- Incluye cantidades aproximadas para cada ingrediente.
- Si algún ingrediente puede sustituirse, indícalo.

Response style and format requirements:
- Utiliza formato de lista para los ingredientes y los pasos.
- Comienza con el nombre de la receta.
- Sé breve y directo.

Example:
# Receta: <nombre de la receta>
## Ingredientes:
- <ingrediente 1>
- <ingrediente 2>
- <ingrediente 3>
...
## Pasos:
1. <paso 1>
2. <paso 2>
3. <paso 3>
...
"""

    response = bedrock.invoke_model_with_response_stream(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        trace="ENABLED",
        body=json.dumps(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": bedrock_prompt,
                            }
                        ],
                    }
                ],
            }
        ),
    )

    recipe = ""

    for response_event in response["body"]:
        chunk = json.loads(response_event["chunk"]["bytes"])
        if "contentBlockDelta" in chunk:
            text: str = chunk["contentBlockDelta"]["delta"]["text"]
            recipe += text

            apigw.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(
                    {
                        "message": text,
                        "type": "recipe",
                    }
                ),
            )

    return {
        "recipe": recipe,
        "connection_id": connection_id,
    }
