module.exports = {
    apps: [
      {
        name: 'sales-tracker-api',
        script: './backend/src/app.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: 5001
        },
        env_production: {
          NODE_ENV: 'production'
        }
      }
    ]
  };