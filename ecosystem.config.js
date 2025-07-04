module.exports = {
  apps: [
    {
      name: 'ielts-edtech-platform',
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      max_memory_restart: '1G',
    },
  ],
}; 