pipeline {
  agent {
    node {
      label 'query-ticket'
    }

  }
  stages {
    stage('build') {
      steps {
        sh 'npm install'
        sh 'npm start'
      }
    }

  }
}