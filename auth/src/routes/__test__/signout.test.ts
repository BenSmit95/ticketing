import request from 'supertest';
import { app } from '../../app';

it('clears the cookie after signing out', async () => {
	const firstResponse = await request(app)
		.post('/api/users/signup')
		.send({
			email: 'test@test.com',
			password: 'tester',
		})
		.expect(201);

	const firstCookie = firstResponse.get('Set-Cookie')[0];

	const secondResponse = await request(app).post('/api/users/signout').send({}).expect(200);

	expect(secondResponse.get('Set-Cookie')[0]).not.toEqual(firstCookie);
});
