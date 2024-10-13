import pytest
from main import app, load_and_prepare_data
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_route(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Analyse de la Consommation" in response.data

def test_data_route(client):
    response = client.get('/data_for_dashboard.json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'dates' in data
    assert 'corrigee' in data
    assert 'brute' in data

def test_load_and_prepare_data():
    df = load_and_prepare_data('Evolution_de_la_consommation.csv')
    assert not df.empty
    assert 'Date' in df.columns
    assert 'Filière' in df.columns
    assert 'Valeur (TWh)' in df.columns

def test_static_files(client):
    response = client.get("/static/style.css")
    assert response.status_code == 200
    assert "text/css" in response.headers["Content-Type"]

    response = client.get("/static/script.js")
    assert response.status_code == 200
    assert "application/javascript" in response.headers["Content-Type"]

if __name__ == '__main__':
    pytest.main()