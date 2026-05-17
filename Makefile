.PHONY: create_cluster

create_cluster:
    @k3d cluster create --config k3d-config.yaml
    @echo -----------------------------------
    @echo |       cluster Summary           |
    @echo -----------------------------------
    @kubectl get nodes -o wide
    @echo -----------------------------------