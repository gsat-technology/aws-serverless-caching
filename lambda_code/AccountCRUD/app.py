from __future__ import print_function
import time
from datetime import datetime, timedelta
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
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(dynamodb_table)

def should_use_cache(h):

    #if the 'Try-Elasticache' header is set false, _don't_ hit it.
    # Otherwise if set to anything else (or not set at all) then try hitting elasticache

    try:
        cache_control = h['Try-Elasticache']
        if cache_control == 'false':
            return False
    except:
        pass

    return True


def get_account(id, use_cache):
    print('get_account() id: ' + id)

    response_item = {
        'account': None
        }

    #try elasticache?
    if use_cache:
        print('trying cache')
        response_item['try_elasticache'] = 'true'
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
        response_item['try_elastiache'] = 'false'

    #if elasticache wasn't tried or it tried and missed, then use db
    if response_item['account'] == None:
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


def get_all_accounts():

    #Note - no need to attempt using cache...
    #it's not possible to 'get all keys' with memcached

    print('get_all_accounts()')

    try:
        db_result = table.scan()
    except:
        return None

    return {
        'accounts': db_result['Items'],
        'count': db_result['Count']
        }


def put_account(account_dict):
    print('put_account(): ' + json.dumps(account_dict))

    db_result = table.put_item(Item=account_dict)
    print(db_result)

    #check dynamodb response. If okay, return account
    if db_result['ResponseMetadata']['HTTPStatusCode'] == 200:
        return account_dict
    else:
        return None


def delete_account(id):
    print('delete_account() id: ' + id)

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
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": None
    }

    if event['httpMethod'] == 'OPTIONS':
        response['statusCode'] = 200
        response['headers']['Access-Control-Allow-Methods'] = "GET,PUT,POST,DELETE"

    if event['httpMethod'] == 'GET':
        print('GET')


        #Get account
        if event['resource'] == "/account/{id}":

            response_body_dict = get_account(event['pathParameters']['id'], should_use_cache(event['headers']))
            response_body_dict['lambda_processed_time'] = (datetime.now() + timedelta(hours=11)).strftime('%d-%m-%Y %H:%M:%S')

            if response_body_dict:
                response['statusCode'] = 200
                response['body'] = json.dumps(response_body_dict)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"error": "resource does not exist"})

        #List accounts
        elif event['resource'] == "/account":
            result = get_all_accounts()
            result['lambda_processed_time'] = (datetime.now() + timedelta(hours=11)).strftime('%d-%m-%Y %H:%M:%S')

            if result:
                response['statusCode'] = 200
                response['body'] = json.dumps(result)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"success": "false"})

    #Create account
    elif event['httpMethod'] == 'POST':
        print('POST')

        if event['resource'] == "/account":

            body = json.loads(event['body'])
            result = put_account(body)

            if result:
                response['statusCode'] = 200
            else:
                response['statusCode'] = 404

            response['body'] = json.dumps(result)

    #Delete account
    elif event['httpMethod'] == 'DELETE':
        if event['resource'] == "/account/{id}":
            result = delete_account(event['pathParameters']['id'])

            if result:
                response['statusCode'] = 200
                response['body'] = json.dumps({"success": "true"})
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps({"success": "false"})

    #Update account
    elif event['httpMethod'] == 'PUT':
        print('PUT')

        if event['resource'] == "/account/{id}":

            body = json.loads(event['body'])
            body['id'] = event['pathParameters']['id']
            result = put_account(body)

            if result:
                response['statusCode'] = 200
                response['body'] = json.dumps(result)
            else:
                response['statusCode'] = 404
                response['body'] = json.dumps(result)

    return response
