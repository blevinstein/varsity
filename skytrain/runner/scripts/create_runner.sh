#!/usr/bin/env bash

if [ -z "$1" ]; then
REGIONS="us-west-1 us-east-2 ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1"
else
REGIONS="$1"
fi

for region in $REGIONS; do

echo "Create log group /aws/lambda/skytrain-runner-$region"
aws logs create-log-group --region "$region" --log-group-name /aws/lambda/skytrain-runner-$region

echo "Create role skytrain-runner-$region"
aws iam create-role \
    --region "$region" \
    --role-name skytrain-runner-$region \
    --assume-role-policy-document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'

LOG_GROUP_POLICY="{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {
      \"Effect\": \"Allow\",
      \"Action\": \"logs:CreateLogGroup\",
      \"Resource\": \"arn:aws:logs:$region:$AWS_ACCOUNT_ID:*\"
    },
    {
      \"Effect\": \"Allow\",
      \"Action\": [
        \"logs:CreateLogStream\",
        \"logs:PutLogEvents\"
      ],
      \"Resource\": [
        \"arn:aws:logs:$region:$AWS_ACCOUNT_ID:log-group:/aws/lambda/skytrain-runner-$region:*\"
      ]
    }
  ]
}"

aws iam put-role-policy \
    --role-name skytrain-runner-$region \
    --policy-name skytrain-runner-log-policy-$region \
    --policy-document="$LOG_GROUP_POLICY"

echo "Create function skytrain-runner-$region"
aws lambda create-function \
    --region "$region" \
    --function-name skytrain-runner-$region \
    --runtime nodejs14.x \
    --zip-file fileb://deploy.zip \
    --handler index.run \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/skytrain-runner-$region

echo "Create function skytrain-runner-$region"
aws events put-rule \
    --region "$region" \
    --name skytrain-runner-$region \
    --schedule-expression "cron(5/9 * * * ? *)"
JSON="{\"region\":\"$region\"}"
aws events put-targets \
    --region "$region" \
    --rule skytrain-runner-$region \
    --targets "Id"="1","Arn"="arn:aws:lambda:$region:$AWS_ACCOUNT_ID:function:skytrain-runner-$region","Input"="'$JSON'"

aws lambda add-permission \
    --region "$region" \
    --function-name skytrain-runner-$region \
    --statement-id skytrain-runner-permission-$region \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:$region:$AWS_ACCOUNT_ID:rule/skytrain-runner-$region

done
