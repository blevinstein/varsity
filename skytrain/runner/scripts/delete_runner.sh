#!/usr/bin/env bash

if [ -z "$1" ]; then
REGIONS="us-west-1 us-east-2 ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1"
else
REGIONS="$1"
fi

for region in $REGIONS; do

echo "Deleting rule skytrain-runner-$region"
aws events remove-targets \
    --region "$region" \
    --rule skytrain-runner-$region \
    --ids 1
aws events delete-rule \
    --region "$region" \
    --name skytrain-runner-$region

echo "Deleting function skytrain-runner-$region"
aws lambda delete-function \
    --region "$region" \
    --function-name skytrain-runner-$region

echo "Deleting log group /aws/lambda/skytrain-runner-$region"
aws logs delete-log-group \
    --region "$region" \
    --log-group-name /aws/lambda/skytrain-runner-$region
aws iam delete-role-policy \
    --role-name skytrain-runner-$region \
    --policy-name skytrain-runner-log-policy-$region

echo "Deleting role skytrain-runner-$region"
aws iam delete-role \
    --region "$region" \
    --role-name skytrain-runner-$region

done
