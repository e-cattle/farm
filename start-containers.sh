#!/usr/bin/env bash
# Arquivo responsável por criar os containers da farm parametrizados
# -----------------------------------------------------------------
green=`tput setaf 2`
reset_color=`tput sgr0`

# Clona repositório kernel-bigboxx, cria diretório kernel
start_kernel() {
    if [ -d "kernel" ]; then
        cd kernel && git pull && cd ..
    else
        git clone https://github.com/e-cattle/kernel.git
    fi
    cd kernel && npm i && npm run start
}

# Clona repositório query (graphql), cria diretório query
start_graphql() {
    if [ -d "query" ]; then
        cd query && git pull && cd ..
    else
        git clone https://github.com/e-cattle/query.git
    fi
}

if [ -z "$1" ]; then
    echo "${green}Utilize o comando sh start-containers.sh farm*.ENV${reset_color}"
else
    # Extrai as variáveis do .ENV para o shell script ($code, $token, $name)
    export $(grep -v '^#' $1 | xargs)
    echo "${green}Preparando repositório kernel para farm $code... ${reset_color}"
    start_kernel
    echo "${green}Preparando repositório query para farm $code... ${reset_color}"
    start_graphql
fi