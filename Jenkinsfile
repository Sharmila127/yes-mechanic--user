pipeline { 
agent any 
environment { 
SONAR_SCANNER_HOME = "/opt/sonar-scanner/bin" 
IMAGE_NAME = "yes-user-panel" 
    } 
 
    stages { 
        stage('Clone Code') { 
            steps { 
                git branch: 'main', url: 'https://github.com/Sharmila127/yes
mechanic--user.git' 
            } 
        } 
 
        stage('Install Node.js') { 
            steps { 
                sh ''' 
                    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - 
                    sudo apt-get install -y nodejs 
                ''' 
            } 
        } 
 
        stage('Install Dependencies') { 
            steps { 
                sh 'npm install' 
            } 
        } 
 
        stage('SonarQube Analysis') { 
            steps { 
                withSonarQubeEnv('My Sonar') { 
                    withCredentials([string(credentialsId: 'sonar-token', variable: 
'SONAR_TOKEN')]) { 
                        sh ''' 
                            export PATH=$SONAR_SCANNER_HOME:$PATH 
                            sonar-scanner \ 
                              -Dsonar.projectKey=user-panel \ 
                              -Dsonar.sources=src \ 
                              -Dsonar.login=$SONAR_TOKEN 
                        ''' 
                    } 
                } 
            } 
        } 
 
        stage('Docker Build') { 
            steps { 
                sh 'docker build -t $IMAGE_NAME .' 
            } 
        } 
 
        stage('Push to DockerHub') { 
            steps { 
                withCredentials([usernamePassword(credentialsId: 'docker-creds', 
usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) { 
                    sh ''' 
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER -
password-stdin 
                        docker tag $IMAGE_NAME $DOCKER_USER/$IMAGE_NAME 
                        docker push $DOCKER_USER/$IMAGE_NAME 
                    ''' 
                } 
            } 
        } 
 
        stage('Deploy to Kubernetes') { 
            steps { 
                sh 'kubectl apply -f k8s/deployment.yaml' 
            } 
        } 
    } 
 
    post { 
        success { 
            echo " Deployment successful!" 
        } 
        failure { 
            echo "Deployment failed. Check logs." 
        } 
    } 
} 
