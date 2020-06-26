import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ currentUser, order }) => {
	const [timeleft, setTimeLeft] = useState(0);

	const { doRequest, errors } = useRequest({
		url: '/api/payments',
		method: 'post',
		body: {
			orderId: order.id,
		},
		onSuccess: () => Router.push('/orders'),
	});

	useEffect(() => {
		const findTimeLeft = () => {
			const msLeft = new Date(order.expiresAt) - new Date();
			setTimeLeft(Math.round(msLeft / 1000));
		};

		findTimeLeft();
		const timerId = setInterval(findTimeLeft, 1000);

		return () => {
			clearInterval(timerId);
		};
	}, []);

	if (timeleft < 0) {
		return <div>Order expired</div>;
	}

	return (
		<div>
			Time left to pay: {timeleft} seconds
			<StripeCheckout
				token={({ id }) => doRequest({ token: id })}
				stripeKey="pk_test_51GxGR0IWHDiUZ4fWKQdBELp1sRdsbhCdJAJkVgzcaN9Y9AcTsZcA7SlzMiL3vgFsfYWlBvuyaGz5yKTgBJvai9IO009ydebSeD"
				amount={order.ticket.price * 100}
				email={currentUser.email}
			/>
			{errors}
		</div>
	);
};

OrderShow.getInitialProps = async (context, client) => {
	const { orderId } = context.query;

	const { data } = await client.get(`/api/orders/${orderId}`);

	return { order: data };
};

export default OrderShow;
