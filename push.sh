COMMIT_MSG=$1
git switch -c dev-branch
git add .
git commit -m $COMMIT_MSG
git push 

docker push rishicse24/spf-server:v_0.0.1
docker push rishicse24/spf-client:v_0.0.1