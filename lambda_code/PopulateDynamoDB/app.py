from __future__ import print_function
import json
import os
import timeit

import boto3

#elasticache settings
fake_data_bucket = os.environ['s3_bucket']
fake_data_key = os.environ['fake_data_key']
dynamodb_table = os.environ['dynamodb_table']

dynamodb = boto3.resource('dynamodb')
s3 = boto3.resource('s3')

def handler(event, context):
    """
    Populate DynamoDB from fake data file in s3
    """

    obj = s3.Object(fake_data_bucket, fake_data_key)
    fake_data = json.loads(obj.get()['Body'].read().decode('utf-8'))

    table = dynamodb.Table(dynamodb_table)

    #time the batch writing operation
    start_time = timeit.default_timer()

    added_item_count = 0

    with table.batch_writer() as batch:
        for item in fake_data:
            added_item_count = added_item_count + 1
            print('done put_item call')
            batch.put_item(Item=item)


    print('done writing')
    elapsed = timeit.default_timer() - start_time
    print('wrote ' + str(len(fake_data)) + ' items in ' + str(elapsed) + ' seconds')


    return 'finished'
