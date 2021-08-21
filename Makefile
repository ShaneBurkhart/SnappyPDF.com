.PHONY: db build

include user.env
-include prod.env

NAME=snappy-pdf
IMAGE_TAG=shaneburkhart/${NAME}
LAMBDA_IMAGE_TAG=${IMAGE_TAG}-lambda
API_IMAGE_TAG=${IMAGE_TAG}-api
REACT_IMAGE_TAG=${IMAGE_TAG}-react

# Console container to start /bin/bash
C?=api

all: run

build:
	docker build -t ${IMAGE_TAG}-api -f packages/api/Dockerfile ./packages/api
	docker build -t ${IMAGE_TAG}-react -f packages/react/Dockerfile ./packages/react
	docker build -t ${IMAGE_TAG}-tailwind -f packages/tailwind/Dockerfile ./packages/tailwind
	docker build -t ${IMAGE_TAG}-lambda -f packages/lambda/Dockerfile ./packages/lambda
	docker build -t ${IMAGE_TAG}-lambda-queue -f packages/lambda-queue/Dockerfile ./packages/lambda-queue

run:
	docker-compose -f docker-compose.dev.yml -p ${NAME} up -d

run_lambda:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api curl -XPOST "http://split_pdf:8080/2015-03-31/functions/function/invocations" -d '{}'

routes:
	docker-compose -f docker-compose.dev.yml run api node -e "const app = require('./server.js'); app._router.stack.forEach(function(r){ if (r.route && r.route.path){ console.log(r.route.path) } }); process.exit();"

c:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm ${C} /bin/bash

npm_install:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm react npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm tailwind npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm lambda_queue_processor npm install

clean_npm_install:
	rm -rf ./packages/api/node_modules
	rm -rf ./packages/api/package-lock.json
	rm -rf ./packages/tailwind/node_modules
	rm -rf ./packages/tailwind/package-lock.json
	rm -rf ./packages/react/node_modules
	rm -rf ./packages/react/package-lock.json
	rm -rf ./packages/lambda-queue/node_modules
	rm -rf ./packages/lambda-queue/package-lock.json
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm react npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm tailwind npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api npm install
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm lambda_queue_processor npm install

c_node:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api node -i -e "const models = require('./models/index.js')"

db:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api npx sequelize-cli db:migrate

db_seed:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api npx sequelize-cli db:seed:all --seeders-path seeders

db_undo:
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm api npx sequelize-cli db:migrate:undo

wipe:
	$(MAKE) clean
	rm -rf data/pg
	$(MAKE) run
	echo "\n\nDatabase needs a minute to start...\nWaiting 30 seconds for Postgres to start...\n\n"
	sleep 30
	$(MAKE) db

clean:
	docker-compose -f docker-compose.dev.yml -p ${NAME} down || true
	docker-compose -f docker-compose.dev.yml -p ${NAME} rm -f || true

pg:
	echo "Enter 'postgres'..."
	docker-compose -f docker-compose.dev.yml -p ${NAME} run --rm pg psql -h pg -d mydb -U postgres --password

ps:
	docker-compose -f docker-compose.dev.yml -p ${NAME} ps

logs:
	docker-compose -f docker-compose.dev.yml -p ${NAME} logs -f

#generate_migration:
	#npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string

########### PROD #################
prod_c:
	docker-compose -f docker-compose.yml -p ${NAME} run --rm api /bin/bash

prod_c_node:
	docker-compose -f docker-compose.yml -p ${NAME} run --rm api node -i -e "const models = require('./models/index.js')"

prod_clean:
	docker-compose -f docker-compose.yml -p ${NAME} down || true
	docker-compose -f docker-compose.yml -p ${NAME} rm -f || true

prod_run:
	docker-compose -f docker-compose.yml -p ${NAME} up -d

prod_db:
	docker-compose -f docker-compose.yml -p ${NAME} run --rm api npx sequelize-cli db:migrate
	docker-compose -f docker-compose.yml -p ${NAME} run --rm api node couchdb_seed.js

prod_db_seed:
	docker-compose -f docker-compose.yml -p ${NAME} run --rm api npx sequelize-cli db:seed:all --seeders-path seeders

prod:
	git checkout master
	git pull origin master
	$(MAKE) build
	$(MAKE) prod_push_lambda
	# Get compiled assets and put them in cwd so nginx can get em
	$(MAKE) prod_clean
	$(MAKE) prod_run
	rm -rf public/dist
	docker cp ${NAME}_api_1:/app/public/dist public/.
	$(MAKE) prod_db
	$(MAKE) prod_run

deploy_staging:
	ssh -A root@warranty-portal-staging.shaneburkhart.com  "cd ~/SquareOneWarrantyPortal; make prod;"

deploy_prod:
	ssh -A root@157.230.56.3 "cd ~/SquareOneWarrantyPortal; make prod;"

#prod_lets_encrypt:
	#apt install python3-certbot-nginx
	#certbot --nginx -d myaqua.unionaquaparks.com
	#systemctl status certbot.timer
	#certbot renew --dry-run

AWS_CLI=docker run -t --rm --env-file prod.env amazon/aws-cli

deploy_lambda:
	docker build -t ${LAMBDA_IMAGE_TAG} -f packages/lambda/Dockerfile ./packages/lambda

	$(AWS_CLI) ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ECR_ADDRESS}
	$(AWS_CLI) ecr describe-repositories --repository-names ${AWS_ECR_REPO_NAME} || \
		$(AWS_CLI) ecr create-repository --repository-name ${AWS_ECR_REPO_NAME} --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE

	docker tag ${LAMBDA_IMAGE_TAG}:latest ${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest
	docker push ${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest

	$(AWS_CLI) lambda get-function --function-name ${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME} || \
		$(AWS_CLI) lambda create-function \
				--function-name ${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME} \
				--role ${AWS_LAMBDA_EXECUTION_ROLE} \
				--code ImageUri=${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest \
				--package-type Image \
				--image-config Command=split_pdf.split

	$(AWS_CLI) lambda update-function-configuration \
				--function-name ${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME} \
				--image-config Command=split_pdf.split \
				--memory-size 512 \
				--timeout 60 \
				--environment Variables={SITE_URL=${SITE_URL},AWS_BUCKET=${AWS_BUCKET},NODE_ENV=${NODE_ENV},AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME=${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME},AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME=${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME}}
	$(AWS_CLI) lambda update-function-code \
				--function-name ${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME} \
				--image-uri ${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest 

	$(AWS_CLI) lambda get-function --function-name ${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME} || \
		$(AWS_CLI) lambda create-function \
				--function-name ${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME} \
				--role ${AWS_LAMBDA_EXECUTION_ROLE} \
				--code ImageUri=${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest \
				--package-type Image \
				--image-config Command=pdf_to_image.to_image

	$(AWS_CLI) lambda update-function-configuration \
				--function-name ${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME} \
				--image-config Command=pdf_to_image.to_image \
				--memory-size 512 \
				--timeout 60 \
				--environment Variables={SITE_URL=${SITE_URL},AWS_BUCKET=${AWS_BUCKET},NODE_ENV=${NODE_ENV},AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME=${AWS_SPLIT_PDF_LAMBDA_FUNCTION_NAME},AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME=${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME}}
	$(AWS_CLI) lambda update-function-code \
				--function-name ${AWS_PDF_TO_IMAGE_LAMBDA_FUNCTION_NAME} \
				--image-uri ${AWS_ECR_ADDRESS}/${AWS_ECR_REPO_NAME}:latest 