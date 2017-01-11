### Getting started
```
git clone https://github.com/gsat-technology/aws-serverless-caching.git
cd aws-serverless-caching
```

#### Upload Lambda deployment packages and test data into S3 bucket

Create a bucket e.g. `your-bucket` (but not that exact name obviously)

Upload test data to my-bucket

```
aws s3 cp mock_data/mock_data.json s3://your-bucket/data/
```
Upload lambda code (Lambda resources in the CloudFormation template rely on these being present)

```
./lambda_deploy.sh your-bucket
```
Contents of the bucket should now look like this:
```
aws s3 ls --recursive s3://your-bucket | awk -v N=$N '{print $4}'
data/mock_data.json
lambda/AccountCRUD.zip
lambda/PopulateDynamoDB.zip
lambda/StreamUpdateElasticache.zip
lambda/TruncateDynamoDB.zip
```

#### Launch CloudFormation Stack

Using the AWS CloudFormation console, upload `cf.yml` and choose parameter values as required.

Or, using the CLI

```
AMI="" #add ubuntu 16.04 ubuntu image (appropriate ami for target region)
KEY_PAIR="" #your existing aws keypair name
S3_BUCKET="" #aforementioned bucket (do not add 's3://')

aws cloudformation create-stack \
    --stack-name aws-serverless-caching \
    --template-body file://cf.yml \
    --capabilities CAPABILITY_IAM \
    --parameters \
                 ParameterKey=UbuntuAMIParameter,ParameterValue=$AMI \
                 ParameterKey=S3ResourceBucket,ParameterValue=$S3_BUCKET \
                 ParameterKey=KeyPairParameter,ParameterValue=$KEY_PAIR
```

Once stack is completed, you can optionally enable the API Gateway cache:

1. In the console go to API Gateway service area
2. Click on the API _<stack_name>APIG_ -> Stages -> _demo_deploy_
3. Select 'Enable API Cache'
4. Choose _0.5GB_ for _Cache capacity_
5. Set _Cache time-to-live (TTL)_ to 31536000 (1 yr)
6. Unselect _Require authorization_

Note: to enable per-item caching for accounts items i.e. _/account/<some_item_id>_,  you will need to:

1. Goto Resources
2. Click on the _ANY_ method under _/account/{id}_
3. Click _method request
4. Expand _Request Paths_
5. tick the _Caching_ checkbox for _id_
6. Redploy the Stage for change to take effect


#### Run the Web UI

This can be run locally e.g.

```
cd www
python -m SimpleHTTPServer
```
then browser to `localhost:8000`

Find the _Invoke URL_ for the stage and paste in at the top of the page.

### Populate Test Data

Invoke `PopulateDynamoDB` lambda function. This will pull data from the S3 bucket and add it to DynamoDB.

### Run Tests

#### Test Latency

Tests the speed difference when using caching (and not using caching)

1. Load test data into database as per above section 'Populate Test Data'
2. Get account ids and store in local file

```
curl <invoke_url>/account 2> /dev/null | jq .accounts[].id --raw-output >> ids.txt
```

Run `latency.sh`

```
./latency.sh <url> [--try-cloudfront-cache | --no-try-cloudfront-cache] [--try-elasticache | no-try-elasticache] <seconds>
```

The script allows you to test two types of caching; API Gateway caching (with CloudFront) and elasticache

- url: API Gateway stage endpoint
- seconds: number of seconds to run the test for

#### Test Requests Until Cache Hit

Very basic test that demonstrates how fast a new record gets cached in elasticache by repeatedly creating a new record and then curling attempting to GET the record and testing if the cache was hit.

Note, this is not a particularly scientific test, just enough to show that after data is cached, that the cached data is available very soon after.

`./requests_until_cache_hit.sh <url> <count>`

- url: API Gateway stage endpoint
- count: number of times to run the test
