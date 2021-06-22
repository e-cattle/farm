### Conteúdo
- [Sobre](#sobre)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Descrição dos elementos](#descrição-dos-elementos)
- [Funcionamento do repositório farm](#funcionamento-do-repositório-farm)


## Sobre

O repositório farm é responsável pelas instâncias das propriedades na nuvem através da utilização de containers [Docker](https://docs.docker.com/) parametrizados por <abbr title="Environment Variables">.ENV</abbr>.


## Estrutura de arquivos

```
  farm:dir
  ├ kernel:dir
  ├ graphql:dir
  └ Dockerfile:file
```


## Descrição dos elementos

- **farm:dir**: Diretório raiz do repositório;
- **kernel:dir**: Diretório responsável por clonar os códigos do **repositório** **[kernel-bigboxx](https://github.com/e-cattle/kernel)**, disponibilizando *endpoints* utilizados na importação de dados dos BigBoxx locais para a nuvem;
- **graphql:dir**: Diretório responsável por instanciar o **repositório** **[query](https://github.com/e-cattle/query)**, disponibilizando consultas via [GraphQL](https://graphql.org/);
- **Dockerfile:file**: Arquivo responsável pela criação dos *containers*:
	- Banco de dados não relacional [MongoDB](https://www.mongodb.com/);
	- Aplicação em [NodeJS](https://nodejs.org/en/) utilizando informações do **repositório** **[web](#link-ecattle-github)**;
	- Aplicação [GraphQL](https://graphql.org/) utilizando informações do diretório **graphql**;
	- Aplicação em [NodeJS](https://nodejs.org/en/) utilizando informações do diretório **kernel**;


## Funcionamento do repositório farm

O repositório farm é utilizado após o pedido de sincronização na nuvem realizado no BigBoxx local. Assim que a sincronização é aprovada através da  **[Aplicação Gestora](#link-ecattle-github)**, o repositório farm recebe os parâmetros da propriedade necessários para criar sua instância na nuvem. A instância da nuvem consiste na criação de quatro containers, cada um responsável por um módulo do ambiente em nuvem. São eles:
- Container com o Banco de dados [MongoDB](https://www.mongodb.com/), utilizado para persistir os dados da propriedade na nuvem;
- Container com [NodeJS](https://nodejs.org/en/), utilizado para a aplicação "Portal Web" responsável pela disponibilização dos dados sincronizados na nuvem e gerenciamento dos BigBoxx vinculados à propriedade. O código da aplicação encontra-se no **repositório** **[web](#link-ecattle-github)**;
- Container com [GraphQL](https://graphql.org/), utilizado para consulta das informações persistidas, é criado através do diretório **graphql** que replica o **repositório** **[query](https://github.com/e-cattle/query)**;
- Container com [NodeJS](https://nodejs.org/en/), utilizado pelo  **repositório** **[kernel-bigboxx](https://github.com/e-cattle/kernel)**.
