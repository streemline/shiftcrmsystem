import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cuyyfrymyenbbzaqqebq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eXlmcnlteWVuYmJ6YXFxZWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTcxOTksImV4cCI6MjA4NzI5MzE5OX0.Id9UFEAN0OCZb3DznLy3yb7qR3exHFEaZjcPGp3x4zU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'StrongPassword123!';
  console.log('Testing SignUp with email:', email);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: 'Test User', role: 'employee' }
    }
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }
  console.log('SignUp Success:', signUpData.user?.email);

  console.log('\nTesting SignIn...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (signInError) {
    console.error('SignIn Error:', signInError);
    return;
  }
  
  console.log('SignIn Success, user ID:', signInData.user?.id);
  console.log('Fetching profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', signInData.user.id)
    .single();
  
  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('Profile:', profile);
  }
}

test();
