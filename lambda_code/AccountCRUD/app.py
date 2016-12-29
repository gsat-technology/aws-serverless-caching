from __future__ import print_function
import time
import os
import uuid
import json

import boto3

use_cache = os.environ['use_elasticache']

if use_cache == 'true':
    use_cache = True
elif use_cache == 'false':
    use_cache = False

#only initialise objects for using
#elasticache if we're actually going to use it
if use_cache:
    import sys
    import socket
    import elasticache_auto_discovery
    from pymemcache.client.hash import HashClient

    #elasticache settings
    elasticache_dns = os.environ['elasticache_dns']
    elasticache_port = os.environ['elasticache_port']
    nodes = elasticache_auto_discovery.discover('{}:{}'.format(elasticache_dns, elasticache_port))
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    memcache_client = HashClient(nodes)

dynamodb_table = os.environ['dynamodb_table']
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(dynamodb_table)



def get_account(id):
    print('getAccount() id: ' + id)

    response_item = {}

    #try elasticache?
    if use_cache:
        print('trying cache')
        response_item['use_cache'] = 'true'
        response_item['account'] = memcache_client.get(id)

        if 'account' in response_item:
            print('cache HIT')
            response_item['cache_lookup'] = 'HIT'

            #return with item from cache
            return response_item
        else:
            print('cache MISS')
            response_item['cache_lookup'] = 'MISS'

    else:
        print('not trying cache')
        response_item['use_cache'] = 'false'

    #if elasticache wasn't tried or it tried and missed, then use db
    if 'account' not in response_item:
        print('trying dynamodb')
        db_result = table.get_item(Key={'id': id})
        print(json.dumps(db_result))

        if 'Item' in db_result:
            response_item['account'] = db_result['Item']
            print('dynamodb get SUCCESS')
            return response_item
        else:
            print('dynamodb get FAILED')
            return None



def handler(event, context):
    """
    Account CRUD operations
    """

    print(json.dumps(event))

    response = {
        "statusCode": None,
        "headers": { "Content-Type": "application/json" },
        "body": None
    }

    if event['httpMethod'] == 'GET':
        print('GET')

        if event['resource'] == "/account/{id}":
            response_body_dict = get_account(event['pathParameters']['id'])

            if response_body_dict:
                print('got it')
                response['statusCode'] = 200
                response['body'] = json.dumps(response_body_dict)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"error": "resource does not exist"})

    else:
        print('non-get method')

    return response
