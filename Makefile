FILE = ./docker-compose.yml

up:
	docker compose -f ${FILE} up --build 

down:
	docker compose -f ${FILE} down
	docker rmi $(docker images -q)

fclean:
	docker compose -f ${FILE} down -v --rmi all

re:clean all
