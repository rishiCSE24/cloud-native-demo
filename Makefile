.PHONY: create_cluster delete_cluster

create_cluster:
        @sudo apt -y install wget
        @wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/ins>
        @sudo snap install kubectl --classic
        @k3d cluster create --config k3d-config.yaml
        @echo "-----------------------------------"
        @echo "|       cluster Summary           |"
        @echo "-----------------------------------"
        @kubectl get nodes -o wide
        @echo "-----------------------------------"

delete_cluster:
        @k3d cluster delete spf-cluster
        @sudo apt -y autoremove wget 
        @sudo snap uninstall kubectl 
