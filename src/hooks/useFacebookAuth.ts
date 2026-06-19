import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";

// Required for redirect handling on web/standalone apps
WebBrowser.maybeCompleteAuthSession();

const APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID!;

export const useFacebookAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: APP_ID,
      redirectUri,
      scopes: ["public_profile", "email"],
      responseType: AuthSession.ResponseType.Token,
    },
    {
      authorizationEndpoint: "https://www.facebook.com/v19.0/dialog/oauth",
    }
  );

  useEffect(() => {
    const getUser = async () => {
      if (response?.type === "success") {
        setLoading(true);
        setError(null);
        try {
          const accessToken = response.params.access_token;

          const profileResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
          );

          if (!profileResponse.ok) {
            setError("Failed to fetch profile info from Facebook Graph API.");
            return;
          }

          const profile = await profileResponse.json();

          setUser({
            ...profile,
            accessToken,
          });
        } catch (err: any) {
          setError(err.message || "Failed to retrieve Facebook profile.");
        } finally {
          setLoading(false);
        }
      } else if (response?.type === "error") {
        setError(response.error?.message || "Facebook Authentication failed.");
      } else if (response?.type === "cancel") {
        setError("Facebook Sign-In was cancelled.");
      }
    };

    getUser();
  }, [response]);

  return {
    promptAsync,
    user,
    request,
    loading,
    error,
    setUser,
  };
};
