pipeline {
  agent any

  environment {
    SITE_DIR = "/var/www/outperformit"
    BUILD_DIR = "dist"
  }

  stages {
    stage('Verify Tools') {
      steps {
        sh '''
          set -e
          echo "Node:"; node -v
          echo "NPM:"; npm -v
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
          npm ci
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -e
          rm -rf dist
          mkdir -p dist/assets

          # Example Tailwind build (change these paths to yours)
          # Make sure src/input.css contains @tailwind directives
          npx tailwindcss -i ./src/input.css -o ./dist/assets/style.css --minify

          # Copy HTML (change if your html is in another folder)
          cp -v ./*.html dist/ || true

          # Copy static folders if you have them
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

          # Clean old deployment (no rsync, so we delete then copy)
          rm -rf "$SITE_DIR"/*

          # Copy new build
          cp -rv "$BUILD_DIR"/* "$SITE_DIR"/

          # Permissions
          chmod -R 755 "$SITE_DIR"

          echo "Deployed files:"
          ls -la "$SITE_DIR"
        '''
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}