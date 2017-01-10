#!/bin/bash

echo ""

#bail out if params are no good
if [ $# -ne 2 ]
then
    echo  "usage: $0 <url> <count>"
    echo ""
    exit
fi

URL=$1
COUNT=$2

echo "url: $URL"
echo "count: $COUNT"
echo ""

COUNTER=1

#loop until user exits
while [ $COUNTER -le $COUNT ]
do
  echo "test $COUNTER of $COUNT"
    
  #new account record
  UUID=$(uuidgen | awk '{print tolower($0)}')
  ID=${UUID:0:8}
  ACCOUNT='{"id": "'$ID'", "full_name": "caching test", "country": "Australia", "avatar": "https://robohash.org/'$ID'.png"}'

  echo "new record: $ID"
  
  #POST to create the account
  curl --data "$ACCOUNT" $URL/account &>/dev/null

  #keep trying to get a cached response
  while [ 1 ]
  do
    #GET the account
    RESULT=$(curl $URL/account/$ID 2>/dev/null | jq .cache_lookup --raw-output)
    
    if [ "$RESULT" == "HIT" ]
    then
	echo "  HIT"
	echo ""
        curl -X DELETE $URL/account/$ID > /dev/null 2>&1
	let COUNTER=COUNTER+1
        break   # <-- break once there's a cache HIT

    elif [ "$RESULT" == "MISS" ]
    then
        echo "  MISS"
    fi
  done
done
