#!/bin/bash

# Copyright (C) HL2 group
#
# All rights reserved
# contact@hl2.com
#
# All information contained herein is, and remains the property of
# HL2 group and its suppliers, if any. The intellectual and technical
# concepts contained herein are proprietary to HL2 group and its suppliers
# and may be covered by foreign patents, patents in process, and are
# protected by trade secret or copyright law. Dissemination of this
# information or reproduction of this material is strictly forbidden unless
# prior written permission is obtained from HL2 group.

# Application deployment script

set -e
#
# Error message function
#
errexit () {
  echo -e "\033[0;31m$1\033[0m"
  exit 1
}
#
#
#
warn(){
  echo -e "\033[0;33m$1\033[0m"
}
#
# Availables commands
#
usage () {
    echo "usage: [-h] [--environment (dev|staging|prod)] [--force]"
    echo "    -h|--help         Help"
    echo "    -e|--environment                    Deployment environment (default dev)"
    echo "    -f|--force                          Remove & create a new static website, otherwise update"
    echo ""
    echo "**********************************************************************"
    echo " > The website name will be the name property in the package.json"
    echo "**********************************************************************"
    exit 1
}

#
# Get the parameters
#
while [ $# -gt 0 ]
do
  key="$1"
  case $key in
    -h|--help)
      usage
    ;;
    -e|--environment)
      environment=$2
      shift
    ;;
    -f|--force)
      force=true
      shift
    ;;
    *)
    usage
    ;;
  esac
  if [[ $# -gt 0 ]]; then
    shift
  fi
done
environment=${environment:=dev}
#
# Check the parameters
#
isValidEnvironment () {
  len=${#1}
  if [[ $len -le 0 || $len -gt 7 ]]; then
    errexit "[ERROR] The environment's length must be between 0 and 7 characters."
  fi
  if [ `echo $1 | grep -c "^\-" ` -gt 0 ]; then
    errexit "[ERROR] The environment mustn't begin with a dash character."
  fi
}
isValidEnvironment $environment
# echo "Environment: $environment"
#
# Build the website name
#
HL2_DOMAIN_NAME="hl2.com"
appName="$(node -p -e "require('./package.json').name")"
# echo "appName: $appName"
if [[ $environment == "prod" ]]; then
  WEBSITE_NAME="${appName}.${HL2_DOMAIN_NAME}"
else
  WEBSITE_NAME="${environment}.${appName}.hl2.com"
fi
echo "websiteName: $WEBSITE_NAME"
#
# S3 : build bucket
#
echo "[INFO] S3 : check for existing bucket"
s3BucketList=$(aws s3 ls \
|| errexit "[ERROR] Could not get S3 bucket list")
INDEX_DOCUMENT='index.html'
ERROR_DOCUMENT='error.html'
if [ `echo $s3BucketList | grep -c "$WEBSITE_NAME" ` -gt 0 ]; then
  if [[ "$force" = true ]]; then
    echo "[INFO] S3 : remove the old bucket"
    aws s3 rb s3://$WEBSITE_NAME \
      --force \
    || errexit "[ERROR] Could not remove S3 bucket"
    echo "[INFO] S3 : replace by a new bucket"
    aws s3 mb s3://$WEBSITE_NAME \
    || errexit "[ERROR] Could not replace S3 bucket"
    echo "[INFO] S3 : re-enable website hosting"
    aws s3 website s3://$WEBSITE_NAME/ \
      --index-document $INDEX_DOCUMENT \
      --error-document $ERROR_DOCUMENT \
    || errexit "[ERROR] Could not re-enable S3 website hosting"
  fi
else
  echo "[INFO] S3 : add a new bucket"
  aws s3 mb s3://$WEBSITE_NAME \
  || errexit "[ERROR] Could not create S3 bucket"
  echo "[INFO] S3 : enable website hosting"
  aws s3 website s3://$WEBSITE_NAME/ \
    --index-document $INDEX_DOCUMENT \
    --error-document $ERROR_DOCUMENT \
  || errexit "[ERROR] Could not enable S3 website hosting"
fi
echo "[INFO] S3 : synchronize bucket"
# @todo: replace 'dist/' by a variable
aws s3 sync dist/ s3://$WEBSITE_NAME \
  --exclude '.*' \
  --exclude '**/.*' \
  --delete \
  --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers \
|| errexit "[ERROR] Could not synchronize S3 bucket"
echo "[INFO] Cloudfront : build the configuration distribution"
FILE_PATH_CLOUDFRONT_DISTRIBUTION_CONFIG=./tools/conf/cloudfront-distribution-$environment.json
if [ -f $FILE_PATH_CLOUDFRONT_DISTRIBUTION_CONFIG ]; then
  distributionConfig=$(<$FILE_PATH_CLOUDFRONT_DISTRIBUTION_CONFIG)
  S3_ENDPOINT="$WEBSITE_NAME.s3.amazonaws.com"
  distributionConfig=${distributionConfig//<DomainName>/$S3_ENDPOINT}
  distributionConfig=${distributionConfig//<WebsiteName>/$WEBSITE_NAME}
else
  errexit "[ERROR] The file '$FILE_PATH_CLOUDFRONT_DISTRIBUTION_CONFIG' is missing"
fi
echo "[INFO] Cloudfront : check for existing distribution"
cloudfrontDistributionList=$(aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].Origins.Items[0].Id' \
|| errexit "[ERROR] Could not check for existing distribution")
if [ `echo $cloudfrontDistributionList | grep -c "S3-$WEBSITE_NAME" ` -gt 0 ]; then
  cloudfrontDistributionIndex="$(node -p -e "$cloudfrontDistributionList.indexOf('"S3-$WEBSITE_NAME"')")"
  echo "[INFO] Cloudfront : get id of old distribution"
  cloudfrontDistributionId=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[$cloudfrontDistributionIndex].Id" \
  || errexit "[ERROR] Could not get id of old distribution")
  cloudfrontDistributionId="${cloudfrontDistributionId//\"}"
  echo "[INFO] Cloudfront : check the status of the old distribution"
  cloudfrontDistributionStatus=$(aws cloudfront get-distribution \
    --id $cloudfrontDistributionId \
    --query 'Distribution.Status' \
  || errexit "[ERROR] Could not check the status of the old distribution")
  cloudfrontDistributionStatus="${cloudfrontDistributionStatus//\"}"
  if [[ $cloudfrontDistributionStatus == "InProgress" ]]; then
    warn "[WARN] Cloudfront : distribution n° $cloudfrontDistributionId is in progress."
    warn "[WARN] Cloudfront : when distribution n° $cloudfrontDistributionId is ready, \n\
      restart this script (see https://console.aws.amazon.com/cloudfront/home). \n\
      don't forget to remove the 'force' parameter to avoid disabling this distribution twice !"
  else
    echo "[INFO] Cloudfront : get if-match of old distribution"
    cloudfrontDistributionIfmatch=$(aws cloudfront get-distribution \
      --id $cloudfrontDistributionId \
      --query 'ETag' \
    || errexit "[ERROR] Could not get if-match of old distribution")
    cloudfrontDistributionIfmatch="${cloudfrontDistributionIfmatch//\"}"
    echo "[INFO] Cloudfront : check the state of the old distribution"
    cloudfrontDistributionState=$(aws cloudfront get-distribution-config  \
      --id $cloudfrontDistributionId \
      --query 'DistributionConfig.Enabled' \
    || errexit "[ERROR] Could not check the state of the old distribution")
    if [[ "$cloudfrontDistributionState" = true ]]; then
      if [[ "$force" = true ]]; then
        echo "[INFO] Cloudfront : load the configuration of old distribution"
        cloudfrontDistributionDistconfig=$(aws cloudfront get-distribution-config  \
          --id $cloudfrontDistributionId \
          --query 'DistributionConfig' \
        || errexit "[ERROR] Could not load the configuration of old distribution")
        cloudfrontDistributionDistconfig=${cloudfrontDistributionDistconfig//\"Enabled\": true/\"Enabled\": false}
        echo "[INFO] Cloudfront : disable old distribution"
        aws cloudfront update-distribution \
          --id $cloudfrontDistributionId \
          --if-match $cloudfrontDistributionIfmatch \
          --distribution-config "$cloudfrontDistributionDistconfig" \
          --query 'Distribution.Status' \
        || errexit "[ERROR] Could not disable old distribution"
        warn "[WARN] Cloudfront : the request to disable the distribution n° $cloudfrontDistributionId has been sent."
        warn "[WARN] Cloudfront : when the distribution n° $cloudfrontDistributionId is deployed, \n\
          restart this script (see https://console.aws.amazon.com/cloudfront/home). \n\
          don't forget to keep the 'force' parameter to removing this distribution definitively !"
      fi
    else
      if [[ "$force" = true ]]; then
        echo "[INFO] Cloudfront : remove old distribution"
        aws cloudfront delete-distribution \
          --id $cloudfrontDistributionId \
          --if-match $cloudfrontDistributionIfmatch \
        || errexit "[ERROR] Could not remove old distribution"
      else
        echo "[INFO] Cloudfront : enable old distribution"
        cloudfrontDistributionDomainname=$(aws cloudfront update-distribution \
          --id $cloudfrontDistributionId \
          --if-match $cloudfrontDistributionIfmatch \
          --distribution-config "$distributionConfig" \
          --query 'Distribution.DomainName' \
        || errexit "[ERROR] Could not enable old distribution")
        warn "[WARN] Cloudfront : the request to enable the distribution n° $cloudfrontDistributionId has been sent. \n\
              the distribution will be deployed when its status changes (check https://console.aws.amazon.com/cloudfront/home)"
      fi
    fi
  fi
else
  echo "[INFO] Cloudfront : create new distribution"
  cloudfrontDistributionDomainname=$(aws cloudfront create-distribution \
    --distribution-config "$distributionConfig" \
    --query 'Distribution.DomainName' \
  || errexit "[ERROR] Could not create Cloudfront distribution")
  warn "[WARN] Cloudfront : the request to deploy the new distribution has been sent. \n\
  the distribution will be deployed when its status changes (check https://console.aws.amazon.com/cloudfront/home)"
  # The route53 record set must be updated
  force=true
fi
if [ -z ${cloudfrontDistributionDomainname+x} ]; then
  echo "[INFO] Cloudfront : get the domain name of the distribution"
  cloudfrontDistributionDomainname=$(aws cloudfront get-distribution \
    --id $cloudfrontDistributionId \
    --query 'Distribution.DomainName' \
  || errexit "[ERROR] Could not get the domain name of the distribution")
  cloudfrontDistributionDomainname="${cloudfrontDistributionDomainname//\"}"
fi
echo "[INFO] route53 : build the configuration record set"
FILE_PATH_ROUTE53_RECORDSET_CONFIG=./tools/conf/route53-recordset-$environment.json
if [ -f $FILE_PATH_ROUTE53_RECORDSET_CONFIG ]; then
  recordsetConfig=$(<$FILE_PATH_ROUTE53_RECORDSET_CONFIG)
  recordsetConfig=${recordsetConfig//<WebsiteName>/$WEBSITE_NAME}
  recordsetConfig=${recordsetConfig//<DNSName>/$cloudfrontDistributionDomainname}
else
  errexit "[ERROR] The file '$FILE_PATH_ROUTE53_RECORDSET_CONFIG' is missing"
fi
echo "[INFO] route53 : check existing record set"
HL2_HOSTED_ZONE_ID="Z8FQN0JAF0S3M"
route53RecordsetList=$(aws route53 list-resource-record-sets \
  --hosted-zone-id $HL2_HOSTED_ZONE_ID \
  --query 'ResourceRecordSets[*].Name' \
|| errexit "[ERROR] Could not check existing record set")
if [ `echo $route53RecordsetList | grep -c "$WEBSITE_NAME" ` -gt 0 ]; then
  if [[ "$force" = true || "$forceSkipCloudfront" = true ]]; then
    echo "[INFO] route53 : update the record set"
    aws route53 change-resource-record-sets \
      --hosted-zone-id $HL2_HOSTED_ZONE_ID \
      --change-batch "$recordsetConfig"
  fi
else
  echo "[INFO] route53 : create the record set"
  aws route53 change-resource-record-sets \
    --hosted-zone-id $HL2_HOSTED_ZONE_ID \
    --change-batch "$recordsetConfig" \
  || errexit "[ERROR] Could not create the record set"
fi
echo -e "\033[0;32mDone\033[0m"
