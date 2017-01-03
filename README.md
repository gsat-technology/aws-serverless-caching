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

(work in progress - more to come)
