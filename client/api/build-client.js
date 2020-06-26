import axios from 'axios';

export default ({ req }) => {
	if (typeof window === 'undefined') {
		// We are on the server
		return axios.create({
			// [servicename].[namespace].svc.cluster.local
			baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',

			// Required for ingress nginx
			headers: req.headers,
		});
	} else {
		// We must be on the browser
		return axios.create({
			baseURL: '/',
		});
	}
};
