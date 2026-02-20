pipeline {
  agent any

  environment {
    SITE_DIR = "/var/www/outperformit"
    BUILD_DIR = "dist"
    NODE_DIR = "${WORKSPACE}/.node"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install Node (no root, temporary)') {
      steps {
        sh '''
          set -e

          # Pick Node version (linux x64). If your VPS is ARM, tell me.
          NODE_VERSION="v20.11.1"
          NODE_TGZ="node-${NODE_VERSION}-linux-x64.tar.xz"
          NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TGZ}"

          mkdir -p "${NODE_DIR}"

          if [ ! -x "${NODE_DIR}/bin/node" ]; then
            echo "Downloading Node ${NODE_VERSION}..."
            curl -fsSL "${NODE_URL}" -o "${WORKSPACE}/${NODE_TGZ}"
            tar -xJf "${WORKSPACE}/${NODE_TGZ}" -C "${WORKSPACE}"
            # Move extracted folder content into NODE_DIR
            rm -rf "${NODE_DIR}"
            mv "${WORKSPACE}/node-${NODE_VERSION}-linux-x64" "${NODE_DIR}"
            rm -f "${WORKSPACE}/${NODE_TGZ}"
          fi

          export PATH="${NODE_DIR}/bin:${PATH}"
          echo "Node: $(node -v)"
          echo "NPM:  $(npm -v)"
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          # Use npm without needing system install
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi
        '''
      }
    }

    stage('Build Tailwind') {
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          rm -rf dist
          mkdir -p dist/assets

          # Adjust paths if needed:
          # If your input css isn't ./src/input.css, change it
          npx tailwindcss -i ./src/input.css -o ./dist/assets/style.css --minify

          # Copy HTML + assets (adjust to your repo structure)
          cp -v ./*.html dist/ || true
          [ -d assets ] && cp -rv assets dist/ || true
          [ -d images ] && cp -rv images dist/ || true
          [ -d public ] && cp -rv public/* dist/ || true

          echo "Build output:"
          ls -la dist
        '''
      }
    }

    stage('Deploy (copy to /var/www)') {
      steps {
        sh '''
          set -e
          mkdir -p "$SITE_DIR"

          # Clean old deployment
          rm -rf "$SITE_DIR"/*

          # Copy new build
          cp -rv "$BUILD_DIR"/* "$SITE_DIR"/

          chmod -R 755 "$SITE_DIR"

          echo "Deployed:"
          ls -la "$SITE_DIR"
        '''
      }
    }
  }

  post {
    always {
      sh '''
        echo "Cleanup workspace Node + artifacts..."
        rm -rf "${NODE_DIR}" node_modules dist || true
      '''
      cleanWs()
    }
  }
}