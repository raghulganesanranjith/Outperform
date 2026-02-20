pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
  }

  environment {
    // ── Change this to your actual server web root ──
    SITE_DIR     = "/var/www/outperformit"
    NODE_DIR     = "${WORKSPACE}/.node"
    NODE_VERSION = "v20.11.1"
  }

  stages {

    // ─────────────────────────────────────────
    stage('Checkout') {
    // ─────────────────────────────────────────
      steps {
        checkout scm
        sh 'echo "=== Repo contents ===" && ls -la'
      }
    }

    // ─────────────────────────────────────────
    stage('Install Node') {
    // ─────────────────────────────────────────
      steps {
        sh '''
          set -e

          # ── Change linux-x64 → linux-arm64 if your VPS is ARM64 ──
          NODE_TGZ="node-${NODE_VERSION}-linux-x64.tar.gz"
          NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TGZ}"

          mkdir -p "${NODE_DIR}"

          if [ ! -x "${NODE_DIR}/bin/node" ]; then
            echo "Downloading Node ${NODE_VERSION}..."
            curl -fsSL "${NODE_URL}" -o "${WORKSPACE}/${NODE_TGZ}"

            echo "Extracting..."
            tar -xzf "${WORKSPACE}/${NODE_TGZ}" -C "${WORKSPACE}"

            rm -rf "${NODE_DIR}"
            mv "${WORKSPACE}/node-${NODE_VERSION}-linux-x64" "${NODE_DIR}"
            rm -f "${WORKSPACE}/${NODE_TGZ}"
          else
            echo "Node already cached."
          fi

          export PATH="${NODE_DIR}/bin:${PATH}"
          node -v && npm -v
        '''
      }
    }

    // ─────────────────────────────────────────
    stage('Install Dependencies') {
    // ─────────────────────────────────────────
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi
        '''
      }
    }

    // ─────────────────────────────────────────
    stage('Build CSS') {
    // ─────────────────────────────────────────
      steps {
        sh '''
          set -e
          export PATH="${NODE_DIR}/bin:${PATH}"

          # Compile Tailwind: input = styles.css (repo root)
          #                   output = styles.css (overwrite in-place, minified)
          # This is intentional — index.html links to styles.css at root level.
          npx tailwindcss \
            -i ./styles.css \
            -o ./styles.css \
            --minify \
            --config ./tailwind.config.js

          echo "=== Built styles.css size ==="
          wc -c styles.css
        '''
      }
    }

    // ─────────────────────────────────────────
    stage('Prepare Deploy Artefacts') {
    // ─────────────────────────────────────────
      steps {
        sh '''
          set -e

          rm -rf _deploy && mkdir -p _deploy

          # ── HTML → index.html ──
          cp -v outperform-nyt.html _deploy/index.html

          # ── Compiled CSS (built in-place above) ──
          cp -v styles.css _deploy/styles.css

          # ── Static assets ──
          [ -f favicon.ico ]  && cp -v favicon.ico  _deploy/ || true
          [ -f sun-logo.svg ] && cp -v sun-logo.svg _deploy/ || true

          echo "=== Deploy artefacts ==="
          ls -lh _deploy/
        '''
      }
    }

    // ─────────────────────────────────────────
    stage('Deploy via SSH') {
    // ─────────────────────────────────────────
      steps {
        sshPublisher(
          publishers: [
            sshPublisherDesc(
              configName: 'outperform-server',   // ← must match the name you set in
                                                  //   Manage Jenkins → System → SSH Servers
              transfers: [
                sshTransfer(
                  // Upload everything inside _deploy/ to SITE_DIR on the server
                  sourceFiles:     '_deploy/**/*',
                  removePrefix:    '_deploy',
                  remoteDirectory: '',

                  // After upload: fix permissions so nginx can read the files
                  execCommand: '''
                    chmod -R 755 /var/www/outperformit && \
                    chmod 644 /var/www/outperformit/index.html \
                              /var/www/outperformit/styles.css  || true
                  '''
                )
              ],
              failOnError: true,
              verbose: true
            )
          ]
        )
      }
    }

  }

  // ─────────────────────────────────────────
  post {
  // ─────────────────────────────────────────
    success {
      echo "✅ Deployed successfully — https://www.outperformit.in"
    }
    failure {
      echo "❌ Build or deploy failed. Check the stage logs above."
    }
    always {
      sh 'rm -rf _deploy node_modules "${NODE_DIR}" || true'
      cleanWs()
    }
  }
}
