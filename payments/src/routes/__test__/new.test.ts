import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Order, OrderStatus } from '../../models/order';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

it('returns a 404 when purchasing an order that does not exist', async () => {
	await request(app)
		.post('/api/payments')
		.set('Cookie', global.signin())
		.send({
			token: 'asasd',
			orderId: mongoose.Types.ObjectId().toHexString(),
		})
		.expect(404);
});

it('returns a 401 when purchasing an order that doesnt belong to the user', async () => {
	const order = Order.build({
		id: mongoose.Types.ObjectId().toHexString(),
		price: 20,
		version: 0,
		userId: mongoose.Types.ObjectId().toHexString(),
		status: OrderStatus.Created,
	});

	await order.save();

	await request(app)
		.post('/api/payments')
		.set('Cookie', global.signin())
		.send({
			token: 'asasd',
			orderId: order.id,
		})
		.expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
	const userId = mongoose.Types.ObjectId().toHexString();

	const order = Order.build({
		id: mongoose.Types.ObjectId().toHexString(),
		price: 20,
		version: 0,
		userId: userId,
		status: OrderStatus.Cancelled,
	});

	await order.save();

	await request(app)
		.post('/api/payments')
		.set('Cookie', global.signin(userId))
		.send({
			orderId: order.id,
			token: 'asdasd',
		})
		.expect(400);
});

it('returns a 201 with valid inputs', async () => {
	const userId = mongoose.Types.ObjectId().toHexString();

	const price = Math.floor(Math.random() * 100_000);

	const order = Order.build({
		id: mongoose.Types.ObjectId().toHexString(),
		price,
		version: 0,
		userId: userId,
		status: OrderStatus.Created,
	});

	await order.save();

	await request(app)
		.post('/api/payments')
		.set('Cookie', global.signin(userId))
		.send({
			orderId: order.id,
			token: 'tok_visa',
		})
		.expect(201);

	const stripeCharges = await stripe.charges.list({ limit: 50 });
	const stripeCharge = stripeCharges.data.find((charge) => {
		return charge.amount === price * 100;
	});

	expect(stripeCharge).toBeDefined();
	expect(stripeCharge!.currency).toEqual('usd');

	const payment = await Payment.findOne({
		stripeId: stripeCharge!.id,
		orderId: order.id,
	});

	expect(payment).not.toBeNull();
});
