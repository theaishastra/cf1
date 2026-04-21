const CONFIG = {
  SUPABASE_URL:      'https://sncdbjltfhgimqnpwiso.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuY2Riamx0ZmhnaW1xbnB3aXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDM0MzgsImV4cCI6MjA5MTgxOTQzOH0.iRLYie4k9pZmts3WQlcrhtRzlZzhCSYPlUUsiBfOLmw',
  BUCKET_AADHAR:     'aadhar',
  BUCKET_SELFIE:     'selfie',
  BUCKET_CARDS:      'cards',
  FN_CREATE_MEMBER:  'create-member-id',
  FN_SEND_EMAIL:     'send-card-email',
  YEAR_PREFIX:       String(new Date().getFullYear()).slice(-2),
};
Object.freeze(CONFIG);
