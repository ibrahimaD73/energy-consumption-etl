install:
	pip install --upgrade pip &&\
		pip install -r requirements.txt

test:
	python -m pytest -vv --cov=main test_main.py

lint:
	pylint --disable=R,C main.py

format:
	black *.py

run:
	FLASK_APP=main.py flask run --host=0.0.0.0 --port=7000

all: install lint test run