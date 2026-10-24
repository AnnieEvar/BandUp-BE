import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET / trả trạng thái hoạt động của API', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    message: 'BandUp API is running',
  });
});

test('GET /practice-users/abc trả 400 vì ID không hợp lệ', async () => {
  const response = await request(app).get('/practice-users/abc');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'ID không hợp lệ',
  });
});

test('POST /practice-users trả 400 khi tên chỉ có khoảng trắng', async () => {
  const response = await request(app)
    .post('/practice-users')
    .send({ name: '   ' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'Tên không hợp lệ',
  });
});

test('POST /practice-users trả 400 khi JSON sai cú pháp', async () => {
  const response = await request(app)
    .post('/practice-users')
    .set('Content-Type', 'application/json')
    .send('{"name":"Minh"');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'JSON không hợp lệ',
  });
});
