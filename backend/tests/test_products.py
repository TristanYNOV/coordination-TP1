import pytest
from flask_jwt_extended import create_access_token

from apps import create_app, db
from apps.base.models import Company, Product


class TestingConfig:
    TESTING = True
    SECRET_KEY = 'test-secret'
    JWT_SECRET_KEY = 'test-jwt-secret'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture()
def app():
    app = create_app(TestingConfig)

    with app.app_context():
        db.create_all()
        company = Company(name='Test Co')
        db.session.add(company)
        db.session.commit()

    yield app

    with app.app_context():
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def auth_headers(app):
    with app.app_context():
        token = create_access_token(identity='test-user')
    return {'Authorization': f'Bearer {token}'}


def test_products_requires_auth(client):
    response = client.get('/api/product/')
    assert response.status_code == 401


def test_products_list(client, app):
    headers = auth_headers(app)
    response = client.get('/api/product/', headers=headers)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload == {'data': []}


def test_products_create_update_delete(client, app):
    headers = auth_headers(app)

    create_response = client.post(
        '/api/product/',
        headers=headers,
        json={
            'name': 'Keyboard',
            'comment': 'RGB',
            'quantity': 3,
            'company_id': 1,
        },
    )

    assert create_response.status_code == 200
    created = create_response.get_json()
    assert created['name'] == 'Keyboard'
    assert created['company_id'] == 1

    product_id = created['id']

    update_response = client.put(
        f'/api/product/{product_id}',
        headers=headers,
        json={'comment': 'Updated'},
    )

    assert update_response.status_code == 200
    updated = update_response.get_json()
    assert updated['comment'] == 'Updated'

    delete_response = client.delete(
        f'/api/product/{product_id}',
        headers=headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.get_json()['message'] == 'Product deleted successfully'

    with app.app_context():
        assert Product.query.get(product_id) is None
