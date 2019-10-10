const app = require('../src/app')

describe('App', () => {
	it('GET / responds with 200 containing "Hello, world!"', () => {
		return supertest(app)
			.get('/')
			.set('Authorization', 'Bearer 8174e308-79c5-4d5b-8c3b-cede7179e3cc')
			.expect(200, 'Hello, world!')
	})
})
