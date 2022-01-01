#!/usr/bin/env bash

for region in us-west-1 us-east-2 ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1; do
echo "Create function skytrain-runner-$region"
aws lambda create-function \
    --region "$region" \
    --function-name skytrain-runner-$region \
    --runtime nodejs14.x \
    --zip-file fileb://deploy.zip \
    --handler index.run \
    --role arn:aws:iam::426523829637:role/service-role/skytrain-runner-role-rv286j05
done
