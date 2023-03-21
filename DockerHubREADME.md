## Sobre
Imagem contendo a aplicação [SchedulerJob](https://github.com/e-cattle/farm) da plataforma [e-Cattle](https://github.com/e-cattle)

## Executando

É necessário informar as variáveis de ambiente para a aplicação funcionar corretamente:
- **URL_MONGO**: Indica endereço do MongoDB, no formato IP:PORTA;
- **URL_API_PORTAINER**: Indica endereço da API do portainer, no formato http://IP_PORTAINER:9000/api;
- **TOKEN_API_PORTAINER**: Token criado no portainer para acesso via API;
- **SWARM_ID**: Identificador da rede *swarm* utilizado para subir as *stacks* das *farms* recém criadas, pode ser obtido através do comando ``` docker info | grep "ClusterID" ``` no node manager da rede *swarm*;


### Iniciar
```
docker stack deploy -c SchedulerJob.yml SchedulerJob
```
### Remover
```
docker stack rm SchedulerJob
```
