require('dotenv').config()
const URL_API_PORTAINER = process.env.URL_API_PORTAINER
const TOKEN_API_PORTAINER = process.env.TOKEN_API_PORTAINER
const URL_MONGO = 'mongodb://' + process.env.URL_MONGO
const SWARM_ID = process.env.SWARM_ID
const MONGO_PORT = 50000
const REDIS_PORT = 51000
const KERNEL_PORT = 52000
const jwt = require('jsonwebtoken')

const Agenda = require('agenda')
const agenda = new Agenda({ db: { address: URL_MONGO + '/admin', collection: 'schedulerJob' } })

const axios = require('axios')
const portainerApi = axios.create({
  baseURL: URL_API_PORTAINER,
  timeout: 20000,
  headers: { 'X-API-Key': TOKEN_API_PORTAINER.replace(/(\r\n|\n|\r)/gm, '') }
})

const { exec } = require('child_process')
const fs = require('fs/promises')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
mongoose.connect(URL_MONGO + '/admin', { useNewUrlParser: true })

mongoose.connection.on('error', (err) => {
  console.log('Erro na conexão com o banco de dados: ' + err)
})

mongoose.connection.on('disconnected', () => {
  console.log('Aplicação desconectada do banco de dados!')
})

mongoose.connection.on('connected', () => {
  console.log('Aplicação conectada ao banco de dados!')
})

const criarToken = (codeFarm) => {
  return jwt.sign({ token: codeFarm }, `TOKENDOENV${codeFarm}`)
}

const checkStacks = async () => {
  await portainerApi.get('/stacks').then(async function (response) {
    console.log(response)
  }).catch(function (error) {
    console.log(error)
    console.log('Erro ao consultar Stacks')
  })
}

const checkTemplates = async () => {
  await portainerApi.get('/templates').then(async function (response) {
    console.log(response.data)
  }).catch(function (error) {
    console.log(error)
    console.log('Erro ao consultar Templates')
  })
}

const statusAPI = async () => {
  portainerApi.get('/system/status').then(function (response) {
    console.log(response.data)
  }).catch(function (error) {
    console.log(error)
    console.log('Erro ao consultar API')
  })
}

/* Verifica se tem farm que requer a orquestração de containers para novo  ambiente cloud */
const verifyNewFarm = async () => {
  const Farm = require('./model/farm')
  Farm.find({ stackSwarmCreated: false }, async (error, farms) => {
    if (farms.length > 0) {
      for (const farm of farms) {
        const code = farm.code
        const token = await criarToken(code)
        const name = farm.name
        await createDockerfileNewFarm(code, token, name)
      }
    } else {
      console.log('Sem novas farms cadastradas')
      console.log(error)
    }
  })
}

/* Cria arquivo Dockerfile específico para farm baseando-se num template em yml */
async function createDockerfileNewFarm (codeFarm, tokenFarm, nameFarm) {
  const mongoPort = MONGO_PORT + codeFarm
  const redisPort = REDIS_PORT + codeFarm
  const kernelPort = KERNEL_PORT + codeFarm
  const dockerfileTitle = `farm_${codeFarm}.yml`
  const nameStack = `stack_${dockerfileTitle.split('.')[0]}`
  const variablesEnv = `env CODE_FARM="${codeFarm}" MONGO_PORT="${mongoPort}" REDIS_PORT="${redisPort}" KERNEL_PORT="${kernelPort}" CLOUD_PK="${tokenFarm}" NAME="${nameFarm}"`
  const commandCreateDockerfileNewFarm = variablesEnv + ` docker compose --compatibility -f DockerfileNewEnvironmentCloud.yml config > ${dockerfileTitle}`

  await exec(commandCreateDockerfileNewFarm, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }

    try {
      const strStack = {
        env: [
          {
            CODE_FARM: codeFarm,
            MONGO_PORT: mongoPort,
            REDIS_PORT: redisPort,
            KERNEL_PORT: kernelPort,
            TOKEN: tokenFarm,
            NAME: nameFarm
          }
        ],
        fromAppTemplate: false,
        name: nameStack
      }
      await createStackFarm(dockerfileTitle, strStack)
    } catch (err) {
      console.log(err)
    }
  })
}

/* Cria a stack da nova farm utilizando o Dockerfile da farm */
async function createStackFarm (dockerfileTitle, strStack) {
  // Criação de stack via API do portainer
  // https://app.swaggerhub.com/apis/portainer/portainer-ce/2.16.2#/stacks/StackCreate

  const formData = {
    params:
    {
      type: 1,
      method: 'string',
      endpointId: 1
    }
  }
  let stackContent = await fs.readFile(dockerfileTitle, { encoding: 'utf8' })
  stackContent = stackContent.replace(/name.*\n/, '')
  stackContent = 'version: "3.8"\n' + stackContent.replace(/["]/g, '')

  await portainerApi.post('/stacks', { Name: strStack.name, SwarmID: SWARM_ID, stackFileContent: stackContent }, formData).then(function (response) {
    console.log('Stack criada com sucesso!')
    const Farm = require('./model/farm')
    //ATUALIZAR FLAG DA FARM PARA STACKCRIADA: TRUE
  }).catch(function (error) {
    console.log(error)
    console.log('Erro ao criar stack via API')
    console.log(stackContent)
  })
}

/* Cria ou Atualiza SchedulerJob que verifica se tem farm nova para subir stack no cloud */
function createCloudEnvironment () {
  agenda.define = ('verificaNovasFarms', async job => {
    await verifyNewFarm()
    await console.log(`Job run ${Date()}`)
  })
  (async function () {
    await agenda.start()
    await agenda.every('2 minutes', 'verificaNovasFarms')
  })

}

createCloudEnvironment()

/*
TODO:
  - Criar schedulerJob para verificar se tem update nas img do dockerhub "kernel-bigboxx" e "cloud" a cada X dias
  - Criar img de cloud e subir no dockerhub
  - Ajustar img do kernel para apontar para Mongo, redis e API cloud da stack da farm que ele pertence
  - AJustar Mongo do agenda (acima) e agendash (yml)
*/
