import { OrderCancelledEvent } from '@cptickets/common';
import mongoose from 'mongoose';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
	// Create an instance of the listener
	const listener = new OrderCancelledListener(natsWrapper.client);

	// Create and save a ticket
	const orderId = mongoose.Types.ObjectId().toHexString();

	const ticket = Ticket.build({
		title: 'concert',
		price: 20,
		userId: 'asdf',
	});
	ticket.set({ orderId });

	await ticket.save();

	// Create the fake data event
	const data: OrderCancelledEvent['data'] = {
		id: orderId,
		version: 0,
		ticket: {
			id: ticket.id,
		},
	};

	//@ts-ignore
	const msg: Message = {
		ack: jest.fn(),
	};

	return { listener, ticket, data, msg, orderId };
};

// do not do all these tests in 1 spec
it('updates the ticket, publishes an event and acks the message', async () => {
	const { msg, data, ticket, orderId, listener } = await setup();

	await listener.onMessage(data, msg);

	const updatedTicket = await Ticket.findById(ticket.id);

	expect(updatedTicket!.orderId).not.toBeDefined();
	expect(msg.ack).toHaveBeenCalled();
	expect(natsWrapper.client.publish).toHaveBeenCalled();
});
