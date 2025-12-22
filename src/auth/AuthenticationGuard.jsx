import { withAuthenticationRequired } from "@auth0/auth0-react";
import React from "react";

export const AuthenticationGuard = ({ component }) => {
    const Component = withAuthenticationRequired(component, {
        onRedirecting: () => (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-xl font-medium text-skipper-primary dark:text-white">Loading...</div>
            </div>
        ),
    });

    return <Component />;
};
