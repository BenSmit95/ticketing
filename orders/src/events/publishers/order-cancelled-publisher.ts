import { Publisher, Subjects, OrderCancelledEvent } from '@cptickets/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
	subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
