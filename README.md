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