// jest.setup.js
process.env.JWT_SECRET = 'test_secret_key_for_testing_purposes_only_do_not_use_in_production_12345678901234567890';
process.env.NODE_ENV = 'test';
process.env.PG_USER = 'test_user';
process.env.PG_PASSWORD = 'test_password';
process.env.PG_HOST = 'localhost';
process.env.PG_PORT = '5432';
process.env.PG_DB_NAME = 'test_database';