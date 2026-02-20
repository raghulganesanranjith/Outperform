pipeline {
  agent any

  environment {
    SITE_DIR = "/var/www/outperformit"
    BUILD_DIR = "dist"
  }

  stages {

    stage('Install Node (temporary)') {
      steps {
        sh '''
          set -e

          echo "Installing Node.js inside container..."

          # Update apt and install node
          apt-get update
          apt-get install -y curl ca-certificates gnupg

          curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
          apt-get install -y nodejs

          echo "Node version:"
          node -v
          echo "NPM version:"
          npm -v
        '''
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          set -e
          npm ci || npm install
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -e

          rm -rf dist
          mkdir -p dist/assets

          # Adjust paths if your input css is different
          npx tailwindcss -i ./src/input.css -o ./dist/assets/style.css --minify

          # Copy HTML files
          cp -v ./*.html dist/ || true

          # Copy static folders if they exist
          [ -d assets ] && cp -rv assets dist/ || true
          [ -d images ] && cp -rv images dist/ || true
          [ -d public ] && cp -rv public/* dist/ || true

          echo "Build output:"
          ls -la dist
        '''
      }
    }

    stage('Deploy to /var/www (copy)') {
      steps {
        sh '''
          set -e

          mkdir -p "$SITE_DIR"

          # Clean old files
          rm -rf "$SITE_DIR"/*

          # Copy new build
          cp -rv "$BUILD_DIR"/* "$SITE_DIR"/

          chmod -R 755 "$SITE_DIR"

          echo "Deployed files:"
          ls -la "$SITE_DIR"
        '''
      }
    }
  }

  post {
    always {
      sh '''
        echo "Cleaning up Node.js and build artifacts..."

        # Remove node and npm (cleanup)
        apt-get remove -y nodejs || true
        apt-get autoremove -y || true
        apt-get clean || true

        # Cleanup workspace
        rm -rf node_modules dist || true
      '''
      cleanWs()
    }
  }
}