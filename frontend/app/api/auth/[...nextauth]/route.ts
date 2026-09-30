import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const handler = NextAuth({
	providers: [
		GitHubProvider({
			clientId: process.env.GITHUB_ID!,
			clientSecret: process.env.GITHUB_SECRET!,
		}),
	],
	
	callbacks: {
		async jwt({ token, account, profile }){
			if(account){
				token.accessToken = account.access_token;
			}
			
			if(profile) {
				const githubProfile = profile as any;
				const githubUsername = githubProfile.login || profile.name || "";
				token.username = githubUsername;
				
				// Sync user profile to backend database on sign in
				try {
					const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
					const response = await fetch(`${backendUrl}/auth/login`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							github_id: String(githubProfile.id),
							username: githubUsername,
							avatar_url: githubProfile.avatar_url || null,
							github_access_token: account?.access_token || null,
						}),
					});
					
					if (response.ok) {
						const backendUser = await response.json();
						token.userId = backendUser.id;
					} else {
						console.error("Backend login sync error:", await response.text());
					}
				} catch (err) {
					console.error("Failed to connect to backend for user sync:", err);
				}
			}
		
			return token;
		},
		
		async session({ session, token }){
			session.accessToken = token.accessToken as string;
			session.username = token.username as string;
			session.userId = token.userId as number;
			return session;
		},
	},
	
	secret: process.env.NEXTAUTH_SECRET,
	debug: true,
});

export { handler as GET, handler as POST };
