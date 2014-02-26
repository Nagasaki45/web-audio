# collect static files
python manage.py collectstatic --noinput

# run the server
# use the PORT environ if it exists
if [ $PORT ]; then
	echo "run server at port $PORT"
	python tornado_main.py --port=$PORT
else
	echo "run server with default port"
	python tornado_main.py
fi