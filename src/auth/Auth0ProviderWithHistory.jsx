
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const Auth0ProviderWithHistory = ({ children }) => {
    const navigate = useNavigate();
    // TODO: Replace with environment variables
    const domain = import.meta.env.VITE_AUTH0_DOMAIN || "placeholder-domain.auth0.com";
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "placeholder-client-id";

    const onRedirectCallback = (appState) => {
        navigate(appState?.returnTo || window.location.pathname);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE || "http://localhost:5000/api",
            }}
            onRedirectCallback={onRedirectCallback}
        >
            {children}
        </Auth0Provider>
    );
};

export default Auth0ProviderWithHistory;
