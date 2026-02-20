pipeline {
  agent {
    docker {
      image 'node:20-alpine'
      args '-u root:root'
    }
  }

  environment {
    BUILD_DIR = 'dist'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm ci'
      }
    }

    stage('Build') {
      steps {
        sh """
          set -e
          mkdir -p ${BUILD_DIR}

          # Build Tailwind using the real HTML file
          npx tailwindcss -i ./styles.css -o ./${BUILD_DIR}/output.css --minify --content ./outperform-nyt.html

          # Publish HTML as dist/index.html
          cp ./outperform-nyt.html ./${BUILD_DIR}/index.html
        """
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: "${BUILD_DIR}/**", fingerprint: true
      }
    }
  }
}