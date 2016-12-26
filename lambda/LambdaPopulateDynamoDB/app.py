from __future__ import print_function
import json

import boto3

#elasticache settings
fake_data_bucket = os.environ['s3_bucket']
fake_data_key = os.environ['fake_data_key']

def handler(event, context):
    """
    Populate DynamoDB from fake data file in s3
    """

    s3 = boto3.resource('s3')

    obj = s3.Object(bucket, key)
    fake_data = json.loads(obj.get()['Body'].read().decode('utf-8'))

    print(fake_data)

    return 'hello'
