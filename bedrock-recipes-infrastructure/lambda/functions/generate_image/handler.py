import os
import json
import boto3
import random
import base64

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

MODEL_ID = os.environ["MODEL_ID"]
WEBSOCKET_ENDPOINT = os.environ["WEBSOCKET_ENDPOINT"]
BUCKET_NAME = os.environ["BUCKET_NAME"]

logger = Logger()
tracer = Tracer()

bedrock = boto3.client("bedrock-runtime")
apigw = boto3.client("apigatewaymanagementapi", endpoint_url=WEBSOCKET_ENDPOINT)
s3 = boto3.client("s3")


@tracer.capture_lambda_handler
def lambda_handler(event: dict, context: LambdaContext):
    recipe: str = event["recipe"]
    connection_id: str = event["connection_id"]

    bedrock_prompt = f"""\
Task:
Genera una imagen atractiva y realista del platillo descrito en la siguiente receta.

Context information:
{recipe[:recipe.lower().index('pasos')].strip()}

Model Instructions:
- La imagen debe resaltar los ingredientes principales y el estilo de la cocina.
- Evita incluir texto o marcas de agua en la imagen.
- Utiliza colores vibrantes y composición atractiva.

Response style and format requirements:
- La imagen debe ser fotorrealista y apetitosa.
- Fondo neutro o relacionado con la cocina del platillo.
"""

    seed = random.randint(0, 858993460)

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(
            {
                "message": "Generating image...",
                "type": "info",
            }
        ),
    )

    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        trace="ENABLED",
        body=json.dumps(
            {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {"text": bedrock_prompt},
                "imageGenerationConfig": {
                    "seed": seed,
                    "quality": "standard",
                    "height": 512,
                    "width": 512,
                    "numberOfImages": 1,
                },
            }
        ),
    )

    model_response = json.loads(response["body"].read())

    base64_image_data = model_response["images"][0]

    image_data = base64.b64decode(base64_image_data)
    s3_key = f"images/{connection_id}/{seed}.png"

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(
            {
                "message": "Saving image to S3...",
                "type": "info",
            }
        ),
    )

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=image_data,
        ContentType="image/png",
    )

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(
            {
                "message": "Image saved successfully",
                "type": "image",
                "image_url": f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}",
            }
        ),
    )

    return {
        "message": "Image generated successfully",
        "image_key": s3_key,
    }
