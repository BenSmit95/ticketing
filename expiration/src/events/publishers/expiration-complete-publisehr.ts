import { ExpirationCompleteEvent, Publisher, Subjects } from '@cptickets/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
	subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
