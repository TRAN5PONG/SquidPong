FILE = ./docker-compose.yml
change-backend-url = ./scripts/set-backend-url.sh localhost
check-services = ./scripts/check-services.sh

up:
	${change-backend-url}
	docker compose -f ${FILE} up --build
	docker compose -f ${FILE} up  --build
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 5
	@${check-services}

start:
	docker compose -f ${FILE} up -d
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 5
	@${check-services}

status:
	@${check-services}

down:
	docker compose -f ${FILE} down
	docker rmi $$(docker images -q)

stop:
	docker compose -f ${FILE} down

fclean:
	docker compose -f ${FILE} down -v --rmi all

re: fclean up

logs:
	docker compose -f ${FILE} logs -f

.PHONY: up start status down stop fclean re logs
