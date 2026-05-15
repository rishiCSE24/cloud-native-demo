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

