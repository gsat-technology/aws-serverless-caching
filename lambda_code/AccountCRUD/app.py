from __future__ import print_function
import time
import os
import uuid
import json

import boto3

#elasticache
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


def get_account(id, use_cache):
    print('get_account() id: ' + id)

    response_item = {
        'account': None
        }

    #try elasticache?
    if use_cache:
        print('trying cache')
        response_item['use_cache'] = 'true'
        response_item['account'] = memcache_client.get(id)

        if response_item['account'] != None:
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
    if response_item['account'] == None:
        print('trying dynamodb')
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(dynamodb_table)
        db_result = table.get_item(Key={'id': id})
        print(json.dumps(db_result))

        if 'Item' in db_result:
            response_item['account'] = db_result['Item']
            print('dynamodb get SUCCESS')
            return response_item
        else:
            print('dynamodb get FAILED')
            return None


def put_account(account_dict):
    print('put_account(): ' + json.dumps(account_dict))

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table)
    db_result = table.put_item(Item=account_dict)
    print(db_result)

    #check dynamodb response. If okay, return account
    if db_result['ResponseMetadata']['HTTPStatusCode'] == 200:
        return account_dict
    else:
        return None


def delete_account(id):
    print('delete_account() id: ' + id)
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_table)

    #delete_item always returns a success '200' response even if item
    # does not exist
    try:
        db_result = table.delete_item(Key={'id': id})
    except:
        return False

    return True




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

            use_cache = True

            try:
                cache_control = event['headers']['Cache-Control']
                if cache_control == 'no-cache':
                    use_cache = False
            except:
                pass

            print(use_cache)

            response_body_dict = get_account(event['pathParameters']['id'], use_cache)

            if response_body_dict:
                print('got it')
                response['statusCode'] = 200
                response['body'] = json.dumps(response_body_dict)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"error": "resource does not exist"})

    elif event['httpMethod'] == 'POST':
        print('PUT')

        if event['resource'] == "/account":

            body = json.loads(event['body'])
            print(body)
            print(type(body))

            result = put_account(body)

            if result:
                response['statusCode'] = 200
                response['body'] = json.dumps(result)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps(result)

    elif event['httpMethod'] == 'DELETE':
        if event['resource'] == "/account/{id}":
            result = delete_account(event['pathParameters']['id'])

            if result:
                response['statusCode'] = 200
                response['body'] = json.dumps({"success": "true"})
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"success": "false"})

    return response
