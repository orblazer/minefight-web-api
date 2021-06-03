allow_k8s_contexts(['local', 'k3d-minefight'])
default_registry('registry.localhost:5000', host_from_cluster='registry.local:5000')

# Deploy: tell Tilt what YAML to deploy
k8s_yaml(['kubernetes/config.yml', 'kubernetes/rbac.yml', 'kubernetes/server-service.yml', 'kubernetes/deployment.yml'])

# Build: tell Tilt what images to build from which directories
docker_build('minefight/web-api', '.',
  build_args={'NODE_ENV': 'development'},
  target='base',
  entrypoint='yarn serve',
  live_update=[
    # when package.json changes, we need to do a full build
    fall_back_on(['package.json', 'yarn.lock', 'tsconfig.json']),
    # Map the local source code into the container under /app
    sync('@types', '/app/@types'),
    sync('src', '/app/src'),
    sync('tsconfig.json', '/app'),
    sync('.eslintignore', '/app'),
    sync('.eslintrc.js', '/app'),
    # Map config files into the container under /app
    sync('discord-config.json', '/app'),
    sync('server-template.yml', '/app'),
  ]
)

# Watch: tell Tilt how to connect locally
k8s_resource('minefight-api', port_forwards=3000)
