import express, { Request, Response } from 'express';
import {
	requireAuth,
	validateRequest,
	NotFoundError,
	OrderStatus,
	BadRequestError,
} from '@cptickets/common';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 1 * 60;

router.post(
	'/api/orders',
	requireAuth,
	[
		body('ticketId')
			.not()
			.isEmpty()
			// Deze is niet netjes, omdat je nu de service koppelt aan de implementatie van de database
			// Omdat je er specifiek van uit gaat dat de ticket een mongo ID betreft
			.custom((input: string) => mongoose.Types.ObjectId.isValid(input))
			.withMessage('ticketId must be provided'),
	],
	validateRequest,
	async (req: Request, res: Response) => {
		const { ticketId } = req.body;
		// Find the ticket the user is trying to order in the database

		const ticket = await Ticket.findById(ticketId);
		if (!ticket) {
			throw new NotFoundError();
		}

		// Make sure that this ticket is not already reserved
		const isReserved = await ticket.isReserved();

		if (isReserved) {
			throw new BadRequestError('Ticket is already reserved');
		}

		// Calculate an expiration date for this order
		const expiration = new Date();
		expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

		// Build the order and save it to the database
		const order = Order.build({
			userId: req.currentUser!.id,
			status: OrderStatus.Created,
			expiresAt: expiration,
			ticket,
		});

		await order.save();

		new OrderCreatedPublisher(natsWrapper.client).publish({
			id: order.id,
			version: order.version,
			userId: order.userId,
			status: order.status,
			expiresAt: order.expiresAt.toISOString(),
			ticket: {
				id: order.ticket.id,
				price: order.ticket.price,
			},
		});
		// Publish an event saying that an order was created
		res.status(201).send(order);
	}
);

export { router as newOrderRouter };
