from __future__ import print_function
import json
import os
#import uuid
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

def handler(event, context):

    for record in event['Records']:

        print("DynamoDB Record: " + json.dumps(record['dynamodb'], indent=2))
        #item = json.dumps(dict(record['dynamodb']['NewImage']))

        if record['eventName'] == 'INSERT' or record['eventName'] == 'MODIFY':
            print('insert/modify')
            image = record['dynamodb']['NewImage']

            #convert from dynamodb item structure to python dict
            item = {
                #'id': image['id']['N'],
                'full_name': image['full_name']['S'],
                'avatar': image['avatar']['S'],
                'country': image['country']['S']
                }

            #store the item using the item's id as the memcached key
            memcache_client.set(image['id']['S'], item)


        elif record['eventName'] == 'REMOVE':
            print('remove')
            key = record['dynamodb']['Keys']['id']['S']
            memcache_client.delete(key)


    return 'Successfully processed records'
