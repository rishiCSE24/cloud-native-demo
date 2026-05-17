.PHONY: create_cluster

create_cluster:
    @apt -y install install wget
    @wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash 
    @snap install kubectl
    @k3d cluster create --config k3d-config.yaml
    @echo "-----------------------------------"
    @echo "|       cluster Summary           |"
    @echo "-----------------------------------"
    @kubectl get nodes -o wide
    @echo "-----------------------------------"