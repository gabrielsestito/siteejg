module.exports = {
  apps: [{
    name: 'ejg-site',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/ejg-site',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};

