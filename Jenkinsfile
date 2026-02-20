pipeline {
  agent any

  options {
    // Avoid double checkout (Declarative would otherwise checkout automatically)
    skipDefaultCheckout(true)

    // Prevent parallel deploys overwriting each other
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

          # Detect architecture for Node download
          ARCH="$(uname -m)"
          case "$ARCH" in
            x86_64|amd64) NODE_ARCH="x64" ;;
            aarch64|arm64) NODE_ARCH="arm64" ;;
            *)
              echo "Unsupported architecture: $ARCH"
              exit 1
              ;;
          esac

          NODE_TGZ="node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz"
          NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TGZ}"

          mkdir -p "${NODE_DIR}"

          if [ ! -x "${NODE_DIR}/bin/node" ]; then
            echo "Downloading Node ${NODE_VERSION} (${NODE_ARCH})..."
            curl -fsSL "${NODE_URL}" -o "${WORKSPACE}/${NODE_TGZ}"

            echo "Extracting Node..."
            tar -xzf "${WORKSPACE}/${NODE_TGZ}" -C "${WORKSPACE}"

            rm -rf "${NODE_DIR}"
            mv "${WORKSPACE}/node-${NODE_VERSION}-linux-${NODE_ARCH}" "${NODE_DIR}"

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
          mkdir -p "${BUILD_DIR}"

          # Build Tailwind CSS from styles.css, scanning the real HTML file for classes
          if [ -f ./styles.css ]; then
            if [ -f ./outperform-nyt.html ]; then
              npx tailwindcss -i ./styles.css -o ./${BUILD_DIR}/styles.css --minify --content ./outperform-nyt.html
            else
              echo "ERROR: outperform-nyt.html not found in repo root (needed for Tailwind content scan)."
              exit 1
            fi
          else
            echo "ERROR: styles.css not found in repo root."
            exit 1
          fi

          # Copy HTML (rename to index.html for nginx default)
          cp -v ./outperform-nyt.html "${BUILD_DIR}/index.html"

          # Copy static files/folders if they exist
          [ -f favicon.ico ] && cp -v favicon.ico "${BUILD_DIR}/" || true
          [ -f sun-logo.svg ] && cp -v sun-logo.svg "${BUILD_DIR}/" || true
          [ -d assets ] && cp -rv assets "${BUILD_DIR}/" || true
          [ -d images ] && cp -rv images "${BUILD_DIR}/" || true
          [ -d public ] && cp -rv public/* "${BUILD_DIR}/" || true

          echo "Build output:"
          ls -la "${BUILD_DIR}"
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

          # Clean old deployment (no rsync as requested)
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
        echo "Cleanup: removing temporary Node + artifacts..."
        rm -rf "${NODE_DIR}" node_modules "${BUILD_DIR}" || true
      '''
      cleanWs()
    }
  }
}