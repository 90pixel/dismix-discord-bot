module.exports = {
  apps: [
    {
      name: 'dismix-bot-dev',
      script: 'start.sh',
      env: {
        NODE_ENV: 'dev',
      },
    },
    {
      name: 'dismix-bot-prod',
      script: 'start.sh',
      env: {
        NODE_ENV: 'prod',
      },
    },
  ],
};
