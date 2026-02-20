pipeline {
  agent any

  options {
    // Avoid double checkout (Declarative would otherwise checkout automatically)
    skipDefaultCheckout(true)

    // Prevent two deployments at the same time
    disableConcurrentBuilds()
  }

  environment {
    SITE_DIR = "/var/www/outperformit"
    BUILD_DIR = "dist"
    NODE_DIR  = "${WORKSPACE}/.node"
    NODE_VERSION = "v20.11.1"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh '''
          echo "Repo files:"
          ls -la
        '''
      }
    }

    stage('Install Node (temporary, no root)') {
      steps {
        sh '''
          set -e

          # If your VPS is ARM64, change linux-x64 -> linux-arm64 in both lines below:
          NODE_TGZ="node-${NODE_VERSION}-linux-x64.tar.gz"
          NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TGZ}"

          mkdir -p "${NODE_DIR}"

          if [ ! -x "${NODE_DIR}/bin/node" ]; then
            echo "Downloading Node ${NODE_VERSION}..."
            curl -fsSL "${NODE_URL}" -o "${WORKSPACE}/${NODE_TGZ}"

            echo "Extracting Node..."
            tar -xzf "${WORKSPACE}/${NODE_TGZ}" -C "${WORKSPACE}"

            rm -rf "${NODE_DIR}"
            mv "${WORKSPACE}/node-${NODE_VERSION}-linux-x64" "${NODE_DIR}"

            rm -f "${WORKSPACE}/${NODE_TGZ}"
          else
            echo "Node already present in workspace cache."
          fi

          export PATH="${NODE_DIR}/bin:${PATH}"
          echo "Node: $(node -v)"
          echo "NPM : $(npm -v)"
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          if [ -f package.json ]; then
            if [ -f package-lock.json ]; then
              npm ci
            else
              npm install
            fi
          else
            echo "No package.json found - skipping npm install."
          fi
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          rm -rf "${BUILD_DIR}"
          mkdir -p "${BUILD_DIR}/assets"

          # ---- BUILD OPTIONS ----
          # Option A (preferred): If you have an npm build script, use it.
          # Uncomment next line if your repo supports it:
          # npm run build

          # Option B: Tailwind CLI build (common for static sites)
          # Update the input/output paths to match your repo.
          if [ -f ./src/input.css ]; then
            npx tailwindcss -i ./src/input.css -o ./${BUILD_DIR}/assets/style.css --minify
          else
            echo "WARNING: ./src/input.css not found. If you use a different input file, update Jenkinsfile."
          fi

          # Copy HTML into dist (adjust if your HTML is elsewhere)
          cp -v ./*.html "${BUILD_DIR}/" 2>/dev/null || true

          # Copy common static folders if present
          [ -d assets ] && cp -rv assets "${BUILD_DIR}/" || true
          [ -d images ] && cp -rv images "${BUILD_DIR}/" || true
          [ -d public ] && cp -rv public/* "${BUILD_DIR}/" || true

          echo "Build output:"
          find "${BUILD_DIR}" -maxdepth 3 -type f | sed 's|^| - |'
        '''
      }
    }

    stage('Deploy to /var/www (copy)') {
      steps {
        sh '''
          set -e

          if [ ! -d "${BUILD_DIR}" ]; then
            echo "ERROR: Build directory ${BUILD_DIR} not found."
            exit 1
          fi

          mkdir -p "${SITE_DIR}"

          # Clean old deployment (no rsync requested)
          rm -rf "${SITE_DIR:?}/"*

          # Copy new build
          cp -rv "${BUILD_DIR}/"* "${SITE_DIR}/"

          chmod -R 755 "${SITE_DIR}"

          echo "Deployed files:"
          ls -la "${SITE_DIR}"
        '''
      }
    }
  }

  post {
    always {
      sh '''
        echo "Cleanup: removing temporary Node + build artifacts..."
        rm -rf "${NODE_DIR}" node_modules "${BUILD_DIR}" || true
      '''
      cleanWs()
    }
  }
}