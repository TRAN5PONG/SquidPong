FILE = ./docker-compose.yml
change-backend-url = ./scripts/set-backend-url.sh

up:
	${change-backend-url}
	docker compose -f ${FILE} up --build 

down:
	docker compose -f ${FILE} down
	docker rmi $(docker images -q)

fclean:
	docker compose -f ${FILE} down -v --rmi all

re:clean all
