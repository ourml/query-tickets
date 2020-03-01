pipeline {
  agent {
    docker {
      image 'node:10.13.0-alpine'
      args '-p 3001:3000'
    }

  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }

    stage('Deliver') {
      steps {
        sh 'set -x'
        sh 'npm start &'
        sh 'set +x'
      }
    }

  }
}
