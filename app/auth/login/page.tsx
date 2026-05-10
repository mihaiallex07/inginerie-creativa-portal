'use client';
import { createClient } from '../../../lib/supabase-client';
export default function LoginPage() {
const supabase = createClient();
async function handleGoogleLogin() {
await supabase.auth.signInWithOAuth({
provider: 'google',
options: {
redirectTo: `${window.location.origin}/auth/callback`,
queryParams: {
// Restricție: doar conturi @ingineriecreativa.ro
hd: 'ingineriecreativa.ro',
},
},
});
}
return (
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', 
justifyContent: 'center', minHeight: '100vh' }}>
<h1>Portal Inginerie Creativă</h1>
<button
onClick={handleGoogleLogin}
style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', 
marginTop: '20px' }}
>
Conectează-te cu Google (@ingineriecreativa.ro)
</button>
</div>
);
}