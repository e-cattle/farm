const Agenda = require('agenda');
const mongoConnectionString = 'mongodb+srv://admin:admin@clusterschedule.pqorz.mongodb.net/meubanco?retryWrites=true&w=majority';
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'schedulerJob' }});
const { exec } = require('child_process');
const MONGO_PORT = 50000;
const REDIS_PORT = 51000;
const KERNEL_PORT = 52000;


/* Verifica se tem farm que requer a orquestração de containers para novo  ambiente cloud */
async function verifyNewFarm() {
  // ---------- BUSCA NO MONGO -----------
  let codeFarm = 10;
  let token = 'asdasdasd';
  let name = 'Fazenda X'
  let newFarm = true;

  if(newFarm) {
    await createDockerfileNewFarm(codeFarm, token, name);
  }
}

/* Cria arquivo Dockerfile específico para farm baseando-se num template em yml */
async function createDockerfileNewFarm(codeFarm, tokenFarm, nameFarm) {
  let mongoPort = MONGO_PORT + codeFarm
  let redisPort = REDIS_PORT + codeFarm
  let kernelPort = KERNEL_PORT + codeFarm
  let dockerfileTitle = `Farm${codeFarm}.yml`;

  const variablesEnv = `env CODE_FARM="${codeFarm}" MONGO_PORT="${mongoPort}" REDIS_PORT="${redisPort}" KERNEL_PORT="${kernelPort}" TOKEN="${tokenFarm}" NAME="${nameFarm}"`;
  const commandCreateDockerfileNewFarm =  variablesEnv + ` docker-compose -f DockerfileNewEnvironmentCloud.yml config > ${dockerfileTitle}`;

  
  await exec(commandCreateDockerfileNewFarm, async (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(stdout);
    console.log(commandCreateDockerfileNewFarm);
    await createStackFarm(dockerfileTitle);
  });
}

/* Cria a stack da nova farm utilizando o Dockerfile da farm */
async function createStackFarm(dockerfileTitle) {
  let nameStack = `Stack${dockerfileTitle.split('.')[0]}`
  const commandCreateStackNewFarm  = `docker stack deploy --compose-file ${dockerfileTitle} ${nameStack}`;
  await exec(commandCreateStackNewFarm, async (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(stdout);
    await console.log('Stack criada');
  });
}

/* Cria ou Atualiza SchedulerJob que verifica se tem farm nova para subir stack no cloud */
function createCloudEnvironment() {
  agenda.define('new cloud environment', async (job) => {
    await console.log(`Job run ${Date()}`);
    await verifyNewFarm();
  });

  (async function () {
    await agenda.start();
    await agenda.every('10 minutes', 'new cloud environment');
  })();
}
createCloudEnvironment();

/* 
TODO: 
  - Criar schedulerJob para verificar se tem update nas img do dockerhub "kernel-bigboxx" e "cloud" a cada X dias 
  - Criar img de cloud e subir no dockerhub  
*/