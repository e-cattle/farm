const Agenda = require('agenda')
const mongoConnectionString = 'mongodb://database:27017'
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'schedulerJob' } })
const mongoose = require('mongoose')
const { exec } = require('child_process')
const MONGO_PORT = 50000
const REDIS_PORT = 51000
const KERNEL_PORT = 52000
const jwt = require('jsonwebtoken')

mongoose.connect(mongoConnectionString, { useNewUrlParser: true })
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

/* Verifica se tem farm que requer a orquestração de containers para novo  ambiente cloud */
async function verifyNewFarm () {
  // ---------- BUSCA NO MONGO -----------
  const Farm = require('./model/farm')
  Farm.find({ stackSwarmCreated: false }, (error, data) => {
    if (data.length > 0) {
      console.log('NOVA FARM ENCONTRADA')
      console.log(data)
      const code = 10
      const token = criarToken(code)
      const name = 'Fazenda X'
      createDockerfileNewFarm(code, token, name)
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
  const dockerfileTitle = `farm-${codeFarm}.yml`

  const variablesEnv = `env CODE_FARM="${codeFarm}" MONGO_PORT="${mongoPort}" REDIS_PORT="${redisPort}" KERNEL_PORT="${kernelPort}" TOKEN="${tokenFarm}" NAME="${nameFarm}"`
  const commandCreateDockerfileNewFarm = variablesEnv + ` docker-compose -f DockerfileNewEnvironmentCloud.yml config > ${dockerfileTitle}`

  await exec(commandCreateDockerfileNewFarm, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    console.log(stdout)
    console.log(commandCreateDockerfileNewFarm)
    await createStackFarm(dockerfileTitle)
  })
}

/* Cria a stack da nova farm utilizando o Dockerfile da farm */
async function createStackFarm (dockerfileTitle) {
  const nameStack = `stack-${dockerfileTitle.split('.')[0]}`
  const commandCreateStackNewFarm = `docker stack deploy --compose-file ${dockerfileTitle} ${nameStack}`
  await exec(commandCreateStackNewFarm, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    console.log(stdout)
    await console.log('Stack criada')
  })
}

/* Cria ou Atualiza SchedulerJob que verifica se tem farm nova para subir stack no cloud */
function createCloudEnvironment () {
  agenda.define = ('new cloud environment', async (job) => {
    await console.log(`Job run ${Date()}`)
    await verifyNewFarm()
  })(async function () {
    await agenda.start()
    await agenda.every('10 minutes', 'new cloud environment')
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
