#!/usr/bin/env bash

for region in us-west-1 us-east-2 ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1; do
echo "Create function skytrain-runner-$region"
aws events put-rule \
    --region "$region" \
    --name skytrain-runner-$region \
    --schedule-expression "cron(5/9 * * * ? *)" || exit 1
JSON="{\"region\":\"$region\", \"config\":\"configs/test.json\"}"
aws events put-targets \
    --region "$region" \
    --rule skytrain-runner-$region \
    --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:$AWS_ACCOUNT_ID:function:skytrain-runner-$region","Input"="'$JSON'" || exit 1
done
