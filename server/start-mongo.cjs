const { MongoMemoryServer } = require('mongodb-memory-server-core');

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27018,
      dbName: 'startup',
      auth: { username: 'startup', password: 'startup_dev_pass' },
    },
  });
  console.log('MongoDB running at:', mongod.getUri());
  process.on('SIGINT', () => { mongod.stop(); process.exit(); });
  process.stdin.resume();
}
main();
