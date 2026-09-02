module.exports = {
  apps: [
    {
      name: 'newapi',
      script: 'dist/server.js',
      cwd: '/var/www/white-server',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
    },
    {
      name: 'revelator-upload-worker',
      script: 'dist/queues/revelator-upload.worker.js',
      cwd: '/var/www/white-server',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
    },
    {
      name: 'revelator-analytics-worker',
      script: 'dist/queues/revelator-analytics.worker.js',
      cwd: '/var/www/white-server',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
    },
  ],
};
