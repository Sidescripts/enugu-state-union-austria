module.exports = {
  apps: [{
    name: 'esua-app',
    script: './app.js',
    instances: 1,
    exec_mode: 'fork', // Changed from cluster for simplicity
    watch: false, // Disabled for production stability
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '512M', // Lowered for shared hosting
    autorestart: true,
    out_file: '/home/qyybymqv/gratoms/server/logs/gratom-app-out.log',
    error_file: '/home/qyybymqv/gratoms/server/logs/gratom-app-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_size: '10M', // Rotate logs at 10MB
    retain: 7, // Keep 7 days of logs
    cron_restart: '0 1 * * *', // Restart after ROI cron
    env: {
      NODE_ENV: 'production',
      DOTENV_CONFIG_PATH: '/home/qyybymqv/gratoms/.env'
    },
    env_development: {
      NODE_ENV: 'development',
      watch: true // Enable watch only in development
    }
  }]
};