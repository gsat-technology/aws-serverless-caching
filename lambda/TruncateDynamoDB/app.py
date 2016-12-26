from __future__ import print_function
import json
import os
import timeit

import boto3

dynamodb_table = os.environ['dynamodb_table']

dynamodb = boto3.resource('dynamodb')
ddb_client = boto3.client('dynamodb')

BATCH_SIZE = 25
COUNT = 1000

def item_count(t_name):
    result = ddb_client.describe_table(TableName=t_name)
    print(result)
    return result['Table']['ItemCount']


def handler(event, context):
    """
    Truncates DynamoDB table
    """
    #get all items


    table = dynamodb.Table(dynamodb_table)
    items = table.scan()['Items']

    start_time = timeit.default_timer()

    with table.batch_writer() as batch:
        for item in items:
            result = batch.delete_item(Key={'id': item['id']})

    elapsed = timeit.default_timer() - start_time
    print('wrote ' + str(len(items)) + ' items in ' + str(elapsed) + ' seconds')


    return 'finished'
