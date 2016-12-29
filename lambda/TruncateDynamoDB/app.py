from __future__ import print_function
import json
import os

import boto3

dynamodb_table = os.environ['dynamodb_table']

dynamodb = boto3.resource('dynamodb')
ddb_client = boto3.client('dynamodb')

def handler(event, context):
    """
    Truncates DynamoDB table
    """

    table = dynamodb.Table(dynamodb_table)
    items = table.scan()['Items']

    with table.batch_writer() as batch:
        for item in items:
            print(item)
            batch.delete_item(Key={'id': item['id']})


    return 'finished'
