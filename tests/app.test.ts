import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import Mail from 'nodemailer/lib/mailer';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.SMTP_USER = 'sender@example.com';
process.env.SMTP_PASS = 'test-only-password';
process.env.JWT_EMAIL_VERIFICATION_SECRET = 'email-verification-test-secret-longer-than-32-characters';
process.env.JWT_ACCESS_SECRET = 'access-token-test-secret-longer-than-32-characters';
process.env.JWT_REFRESH_SECRET = 'refresh-token-test-secret-longer-than-32-characters';
process.env.PUBLIC_API_URL = 'http://localhost:3000';

const [{ app }, { prisma }] = await Promise.all([
  import('../src/app.js'),
  import('../src/prisma.js'),
]);

test('GET / returns the API status', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    message: 'BandUp API is running',
  });
});

test('GET /practice-users/abc returns 400 for an invalid ID', async () => {
  const response = await request(app).get('/practice-users/abc');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'Invalid ID',
  });
});

test('POST /practice-users returns 400 for a whitespace-only name', async () => {
  const response = await request(app)
    .post('/practice-users')
    .send({ name: '   ' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'Invalid name',
  });
});

test('POST /practice-users returns 400 for malformed JSON', async () => {
  const response = await request(app)
    .post('/practice-users')
    .set('Content-Type', 'application/json')
    .send('{"name":"Minh"');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: 'Invalid JSON',
  });
});

test('Register and verify email with a link', async (t) => {
  const users = new Map<string, any>();
  const sentEmails: any[] = [];
  let mailFails = false;

  // Prisma's user delegate is a proxy; save and restore its methods for this test.
  const replaceMethod = (name: string, implementation: any) => {
    const original = (prisma.user as any)[name];
    (prisma.user as any)[name] = implementation;
    t.after(() => { (prisma.user as any)[name] = original; });
  };

  replaceMethod('findUnique', async ({ where, select }: any) => {
    const user = [...users.values()].find((value) => where.email ? value.email === where.email : value.id === where.id);
    return user ? Object.fromEntries(Object.keys(select).map((key) => [key, user[key]])) : null;
  });
  replaceMethod('create', async ({ data, select }: any) => {
    const user = {
      ...data, id: String(users.size + 1), role: 'STUDENT',
      emailVerifiedAt: null, deletedAt: null,
    };
    users.set(user.email, user);
    return Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]));
  });
  replaceMethod('updateMany', async ({ where, data }: any) => {
    const user = [...users.values()].find((value) => value.id === where.id
      && value.email === where.email && value.status === where.status && value.deletedAt === null);
    if (!user) return { count: 0 };
    Object.assign(user, data);
    return { count: 1 };
  });
  replaceMethod('deleteMany', async ({ where }: any) => {
    const user = [...users.values()].find((value) => value.id === where.id
      && value.status === where.status && value.emailVerifiedAt === null);
    if (!user) return { count: 0 };
    users.delete(user.email);
    return { count: 1 };
  });
  t.mock.method(Mail.prototype, 'sendMail', async (message: any) => {
    if (mailFails) throw new Error('SMTP unavailable');
    sentEmails.push(message);
    return { accepted: [message.to] };
  });

  const credentials = { email: 'student@example.com', password: 'a-test-password' };
  const register = (body: object) => request(app).post('/api/v1/auth/register').send(body);

  assert.equal((await register({ ...credentials, password: 'short' })).status, 400);
  assert.equal((await register({ ...credentials, email: 'invalid-email' })).status, 400);
  const response = await register({ ...credentials, email: ' STUDENT@example.com ' });
  assert.equal(response.status, 201);
  assert.deepEqual(response.body, {
    id: '1', email: credentials.email, role: 'STUDENT', status: 'PENDING_VERIFICATION',
  });
  assert.ok(await argon2.verify(users.get(credentials.email).passwordHash, credentials.password));
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, credentials.email);
  assert.match(sentEmails[0].text, /This link expires in 30 minutes/);
  const link = new URL(sentEmails[0].text.match(/https?:\/\/\S+/)[0]);
  assert.equal(link.pathname, '/api/v1/auth/verify-email');
  assert.ok(link.searchParams.get('token'));
  assert.equal((await register(credentials)).status, 409);
  assert.equal((await request(app).post('/api/v1/auth/login').send(credentials)).status, 401);

  assert.equal((await request(app).get('/api/v1/auth/verify-email')).status, 400);
  assert.equal((await request(app).get('/api/v1/auth/verify-email').query({ token: 'invalid' })).status, 400);
  const expiredToken = await new SignJWT({ email: credentials.email, tokenType: 'emailVerification' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('1')
    .setIssuer('bandup-api')
    .setAudience('bandup-web')
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
    .sign(new TextEncoder().encode(process.env.JWT_EMAIL_VERIFICATION_SECRET));
  assert.equal((await request(app).get('/api/v1/auth/verify-email').query({ token: expiredToken })).status, 400);
  assert.equal((await request(app).post('/api/v1/auth/resend-verification').send({ ...credentials, password: 'wrong' })).status, 401);
  const resent = await request(app).post('/api/v1/auth/resend-verification').send(credentials);
  assert.equal(resent.status, 200);
  assert.deepEqual(resent.body, { message: 'Verification email sent' });
  assert.equal(sentEmails.length, 2);
  const newLink = new URL(sentEmails[1].text.match(/https?:\/\/\S+/)[0]);
  const verified = await request(app).get(newLink.pathname + newLink.search);
  assert.equal(verified.status, 200);
  assert.deepEqual(verified.body, { message: 'Email verified successfully' });
  assert.equal(users.get(credentials.email).status, 'ACTIVE');
  assert.ok(users.get(credentials.email).emailVerifiedAt instanceof Date);
  assert.equal((await request(app).get(newLink.pathname + newLink.search)).status, 200);
  assert.equal((await request(app).post('/api/v1/auth/resend-verification').send(credentials)).status, 401);

  const login = await request(app).post('/api/v1/auth/login').send(credentials);
  assert.equal(login.status, 200);
  assert.equal(typeof login.body.accessToken, 'string');
  assert.equal(login.body.refreshToken, undefined);
  assert.equal((await request(app).get('/api/v1/users/me').auth(login.body.accessToken, { type: 'bearer' })).status, 200);

  const setCookie = login.headers['set-cookie'];
  assert.ok(Array.isArray(setCookie));
  const refreshSetCookie = setCookie.find((value: string) => value.startsWith('bandup_refresh='));
  assert.ok(refreshSetCookie);
  assert.match(refreshSetCookie, /HttpOnly/);
  assert.match(refreshSetCookie, /SameSite=Lax/);
  const refreshCookie = refreshSetCookie.split(';')[0];

  assert.equal((await request(app).post('/api/v1/auth/refresh')).status, 401);
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', 'bandup_refresh=invalid')).status, 401);
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', `bandup_refresh=${login.body.accessToken}`)).status, 401);

  const expiredRefreshToken = await new SignJWT({ tokenType: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('1')
    .setIssuer('bandup-api')
    .setAudience('bandup-web')
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
    .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET));
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', `bandup_refresh=${expiredRefreshToken}`)).status, 401);

  const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie);
  assert.equal(refreshed.status, 200);
  assert.equal(typeof refreshed.body.accessToken, 'string');
  assert.equal((await request(app).get('/api/v1/users/me').auth(refreshed.body.accessToken, { type: 'bearer' })).status, 200);

  users.get(credentials.email).status = 'DEACTIVATED';
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie)).status, 401);
  users.get(credentials.email).status = 'ACTIVE';

  const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', refreshCookie);
  assert.equal(logout.status, 200);
  assert.deepEqual(logout.body, { message: 'Logged out successfully' });
  assert.match(logout.headers['set-cookie'][0], /bandup_refresh=;/);
  assert.equal((await request(app).post('/api/v1/auth/refresh')).status, 401);
  // Without a server-side session, a copied cookie remains valid until its JWT expires.
  assert.equal((await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie)).status, 200);

  mailFails = true;
  t.mock.method(console, 'error', () => {});
  assert.equal((await register({ email: 'retry@example.com', password: credentials.password })).status, 500);
  assert.equal(users.has('retry@example.com'), false);
});
