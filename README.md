# cloud-native-demo
Repository to demonstrate full stack cloud native  application deployment 

# Tutorial 
## Docker Installation 
Install docker container engine

```bash
sudo apt -y update && sudo apt -y install docker.io \\
sudo usermod -aG docker $USER \\
newgrp docker
```

Verify Installation 
```bash
docker --version && docker ps
```

You should see the following output. (version number may differ)
```
Docker version 29.1.3, build 29.1.3-0ubuntu3~22.04.2
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

## Install Prerequisits 
Install the required packages 
```bash 
sudo apt -y install \\
    git 
```

## Clone Repository 
Clone the repository locally 
```bash
rm -rf cloud-native-demo.git
git clone https://github.com/rishiCSE24/cloud-native-demo.git
```

Enter the project directory
```bash
cd cloud-native-demo
```

Make the local scripts executable 
```bash
chmod +x *.sh
```

Fresh Run (all-in-one command)
```bash
 ./unrun.sh && ./build.sh && ./run.sh 
```
Verify Images in Local docker registry
```bash 
docker images 
docker ps
docker logs spf-client 
docker logs spf-server
```
Push Docker Images to DockerHub and source code to Github 
```bash
BRANCH_NAME='dev-name'
COMMIT_MSG='commit-text'
./push $BRANCH_NAME $COMMIT_MSG
```

# Task 1: Kubernetes Deployment 
## Create a Kubernetes cluster using k3d wrapper 
For more information about k3d visit here [LINK](https://k3d.io/stable/). 
```bash
sudo apt -y install wget
wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
k3d cluster create --config k3d-config.yaml
```
## Install kubectl 
Kubectl is a RESTful client application that invokes K8s API and interfaces with user. 
```bash
kudo snap install kubectl --classic
```
## Verify
Verify a cluster with master and worker nodes exisits as defined in the `k3d-config.yaml` file. 
```bash
kubectl get nodes -o wide
```
## Revert
To revert changes 
```bash 
# delete cluster
k3d cluster delete spf-cluster 
# remove kubectl 
sudo snap remove kubectl 
```

# Task 2: Onboard Application [OPTIONAL]
This is an optional task in case of demonstrating app onboarding without reconsiliation. 
```bash
kubectl apply -f conf/spf-server.yaml
kubectl apply -f conf/spf-client.yaml
```


# Task 3: ArgoCD Integration 
[ArgoCD](https://argo-cd.readthedocs.io/en/stable/) is the reconcilitation tool between K8s and Github repo. It refers to a path of the GitHub where the desired states are stored to sync with the local k8s cluster. 
## Adding Argo Operator
For more details visit [here](https://argo-cd.readthedocs.io/en/stable/getting_started/)
```bash
# create a namespace for argocd operator 
kubectl create namespace argocd
# add argocd operator using online manifest
kubectl apply -n argocd --server-side --force-conflicts \
    -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
## Get Temp Password 
Decode and copy `argocd-initial-admin-secret`
```bash 
kubectl -n argocd get secret argocd-initial-admin-secret \
            -o jsonpath="{.data.password}" | base64 -d; echo
```

## Port Forward for external access
Forward https endport to `TCP 8080` port
```bash
nohup kubectl -n argocd port-forward \
    --address 0.0.0.0 \
    svc/argocd-server \
    8080:443 > argocd-port-forward.log 2>&1 &
```

## Argo Config 
### Access WebUI
After forwarding ArgoCD will be available in port `8080` with credential `admin/INIT_SECRET`.  Make sure to update admin password after initial login.
### Setup 
Set the following settingin the GUI
* Name: `spf-app`
* Project: `default`
* Repo URL: `GIT_MAIN_BR`
    * PATH: `conf`
* Cluster: `Local`
* Sync Policy 
    * `Auto Sync`
    * `Prune Resource`
    * `Self Heal`

### Reconciliation 
After the app is set up, it will iniate an auto-sync procedure which will detect the current state of the k8s cluster does not have the `spf-app`, hence it will automate the deployment. 

To verify auto-sync, update the number of replica in the manifest at the Single Source of Truth (SSoT) (i.e., Git Repo), it should reflect in the cluster. 

## Revert 
To revert changes 
```bash
#delete the argocd namespace  
kubectl delete ns argocd 
# Kill the port-forwarding process
pkill -f "kubectl -n argocd port-forward"
```

