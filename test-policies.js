import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cuyyfrymyenbbzaqqebq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eXlmcnlteWVuYmJ6YXFxZWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcxNzE5OSwiZXhwIjoyMDg3MjkzMTk5fQ.eOMYXxLcHgiDd1RqPv0HRClr-DjfEpD9ejlWHmxoPnc';

async function fetchPolicies() {
  const response = await fetch(`${supabaseUrl}/rest/v1/pg_policies`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  if (response.ok) {
    const data = await response.json();
    console.log(data);
  } else {
    console.log('Failed:', response.status, await response.text());
  }
}

fetchPolicies();
