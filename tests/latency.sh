#!/bin/bash

#Tests


echo ""

#bail out if params are no good
if [ $# -ne 4 ]
then
    echo  "usage: $0 <url> [--try-apig-cache | --no-try-apig-cache] [--try-elasticache | no-try-elasticache] <seconds>"
    echo ""
    exit
fi

URL=$1
SECS=$4

for key in "$@"
do

    case $key in
	--try-apig-cache)
            echo "apig cache will be tried"
	    apig=true
	    MAX_AGE=31536000 #1 year
	    shift
	    ;;
	--no-try-apig-cache)
	    echo "apig cache will not be tried"
	    apig=false
	    MAX_AGE=0
	    shift # past argument
	    ;;
	--try-elasticache)
            echo "elasticache will be tried"
	    ELASTICACHE=true
	    shift # past argument
	    ;;
	--no-try-elasticache)
	    echo "elasticache will not be tried"
	    ELASTICACHE=false
	    ;;
	*)
	    # unknown option
	    ;;
    esac
    shift
done

echo "url: $URL"
echo "seconds: $SECS"
echo ""


#GET all account ids
ACCOUNTS=$(cat ids.txt)

NUM_ITEMS=$(echo $ACCOUNTS | wc -w)
echo "Doing GET for $NUM_ITEMS accounts"

end=$((SECONDS+$SECS))
echo $end
echo "script will finish after $SECS seconds"

COUNTER=0

while [ 1 ]
do
    for ACC in $ACCOUNTS
    do
        if [ $SECONDS -gt $end ];
	then
	    echo "exiting"
            exit 0
	fi

	echo "elapsed: $SECONDS (will end at $SECS seconds)"
	echo "request #$COUNTER"
	echo "account id: $ACC"

	echo $URL/account/$ACC
        curl $URL/account/$ACC -H "Cache-Control:max-age=$MAX_AGE" -H "Try-Elasticache:$ELASTICACHE" 2> /dev/null | jq

	let COUNTER=COUNTER+1
    done
done
