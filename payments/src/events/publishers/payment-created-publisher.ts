import { Publisher, PaymentCreatedEvent, Subjects } from '@cptickets/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
	subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
