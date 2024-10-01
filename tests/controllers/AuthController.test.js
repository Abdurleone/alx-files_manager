/* eslint-disable import/no-named-as-default */
import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('+ AuthController', () => {
  const mockUser = {
    email: 'kaido@beast.com',
    password: 'hyakuju_no_kaido_wano',
  };
  let token = '';

  // Set up the user before tests run
  before(async function () {
    this.timeout(10000);
    try {
      const usersCollection = await dbClient.usersCollection();
      await usersCollection.deleteMany({ email: mockUser.email });
      
      const res = await request.post('/users')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect(201);
        
      expect(res.body.email).to.eql(mockUser.email);
      expect(res.body.id.length).to.be.greaterThan(0);
    } catch (error) {
      throw new Error(error);
    }
  });

  // Testing /connect route
  describe('+ GET: /connect', () => {

    it('+ Should return 401 when no "Authorization" header is provided', async function () {
      this.timeout(5000);
      const res = await request.get('/connect').expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 401 for a non-existent user', async function () {
      this.timeout(5000);
      const res = await request.get('/connect')
        .auth('foo@bar.com', 'raboof', { type: 'basic' })
        .expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 401 with valid email but wrong password', async function () {
      this.timeout(5000);
      const res = await request.get('/connect')
        .auth(mockUser.email, 'raboof', { type: 'basic' })
        .expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 401 with invalid email and valid password', async function () {
      this.timeout(5000);
      const res = await request.get('/connect')
        .auth('zoro@strawhat.com', mockUser.password, { type: 'basic' })
        .expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 200 and a token for an existing user', async function () {
      this.timeout(5000);
      const res = await request.get('/connect')
        .auth(mockUser.email, mockUser.password, { type: 'basic' })
        .expect(200);
        
      expect(res.body.token).to.exist;
      expect(res.body.token.length).to.be.greaterThan(0);
      token = res.body.token;  // Assign token for later use in /disconnect tests
    });
  });

  // Testing /disconnect route
  describe('+ GET: /disconnect', () => {

    it('+ Should return 401 when no "X-Token" header is provided', async function () {
      this.timeout(5000);
      const res = await request.get('/disconnect').expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 401 for an invalid token', async function () {
      this.timeout(5000);
      const res = await request.get('/disconnect')
        .set('X-Token', 'raboof')
        .expect(401);
      expect(res.body).to.deep.eql({ error: 'Unauthorized' });
    });

    it('+ Should return 204 and no content with a valid "X-Token"', async function () {
      this.timeout(5000);
      const res = await request.get('/disconnect')
        .set('X-Token', token)
        .expect(204);
        
      expect(res.body).to.deep.eql({});
      expect(res.text).to.eql('');
      expect(res.headers['content-type']).to.not.exist;
      expect(res.headers['content-length']).to.not.exist;
    });
  });

  // Redis client tests
  describe('+ Redis Tests', () => {

    it('+ Should expire a value after a certain time', async function () {
      this.timeout(7000);  // Allow enough time for the test
      await redisClient.set('test_key', 356, 1);  // Expires in 1 second
      
      await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds
      const value = await redisClient.get('test_key');
      expect(value).to.be.null;  // Value should have expired
    });

    it('+ Should delete and confirm absence of a value', async function () {
      this.timeout(5000);
      await redisClient.set('test_key', 345, 10);  // Expires in 10 seconds
      await redisClient.del('test_key');  // Delete the key
      
      const value = await redisClient.get('test_key');
      expect(value).to.be.null;  // Value should be null since it's deleted
    });
  });
});
