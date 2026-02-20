pipeline {
  agent any

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

          # Build Tailwind CSS using the real HTML file
          npx tailwindcss -i ./styles.css -o ./${BUILD_DIR}/output.css --minify --content ./outperform-nyt.html

          # Copy HTML to dist as index.html
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