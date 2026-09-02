module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=768',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'revelator-upload-worker',
      script: 'dist/queues/revelator-upload.worker.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'revelator-analytics-worker',
      script: 'dist/queues/revelator-analytics.worker.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
