.PHONY: create_cluster delete_cluster install_argo delete_argo install_spf_app run

create_cluster:
        @sudo apt -y install wget
        @wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
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
        @sudo snap remove kubectl 

install_argo:
        @kubectl create namespace argocd

        @kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

        @kubectl -n argocd get secret argocd-initial-admin-secret \
            -o jsonpath="{.data.password}" | base64 -d; echo

        @nohup kubectl -n argocd port-forward \
            --address 0.0.0.0 \
            svc/argocd-server \
            8080:443 > argocd-port-forward.log 2>&1 &

delete_argo:
        @kubectl delete ns argocd 
        @pkill -f "kubectl -n argocd port-forward"

install_spf_app:
        @kubectl apply -f spf-server.yaml
        @kubectl apply -f spf-client.yaml

run: create_cluster install_argo install_spf_app
        @echo done!
