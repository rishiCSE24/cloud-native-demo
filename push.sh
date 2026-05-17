#! /bin/bash
set -e 
BRANCH=$1
COMMIT_MSG=$2

if [ $# -eq 2 ] ; then
    git switch $BRANCH
    git add .
    git commit -m $COMMIT_MSG
    git push

    docker push rishicse24/spf-server:v_0.0.1
    docker push rishicse24/spf-client:v_0.0.1
else 
    echo "ERROR: INVALID_ARG --> Usage: ./push BRANCH COMMIT_MSG"
fi

