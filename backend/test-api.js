const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(name, path, options = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`\n--- Testing: ${name} (${options.method || 'GET'} ${path}) ---`);
    
    let bodyStr;
    if (options.body) {
      bodyStr = JSON.stringify(options.body);
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      options.body = bodyStr;
    }

    const res = await fetch(url, options);
    const data = await res.json();
    
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.status >= 400) {
      console.error(`❌ ${name} failed with status ${res.status}`);
    } else {
      console.log(`✅ ${name} passed!`);
    }
    return data;
  } catch (error) {
    console.error(`❌ ${name} failed with error:`, error.message);
  }
}

async function runTests() {
  // 1. Health check
  await testEndpoint('Health Check', '/health');

  // 2. Get list of tickets (initial)
  const initialList = await testEndpoint('Get Initial Tickets List', '/tickets');

  // 3. Create a ticket
  const newTicket = await testEndpoint('Create Ticket', '/tickets', {
    method: 'POST',
    body: {
      customer_name: 'Test User',
      customer_email: 'test.user@example.com',
      subject: 'Test Ticket Subject',
      description: 'This is a test ticket description.',
      priority: 'High'
    }
  });

  if (!newTicket || !newTicket.ticket_id) {
    console.error('Failed to create ticket, skipping detailed tests.');
    return;
  }

  const createdId = newTicket.ticket_id;

  // 4. Get created ticket details
  await testEndpoint('Get Ticket Details', `/tickets/${createdId}`);

  // 5. Update ticket status and add a note
  await testEndpoint('Update Ticket Status & Add Note', `/tickets/${createdId}`, {
    method: 'PUT',
    body: {
      status: 'In Progress',
      note_text: 'Adding a verification note to this ticket.'
    }
  });

  // 6. Get updated ticket details to verify changes
  await testEndpoint('Get Updated Ticket Details', `/tickets/${createdId}`);

  // 7. Get all tickets list (should show updated counts/total)
  await testEndpoint('Get Updated Tickets List', '/tickets?status=In%20Progress');
}

// Check if server is running before executing tests
const req = http.get('http://localhost:3001/api/health', (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    runTests();
  });
});

req.on('error', (err) => {
  console.error('Error: Express backend server is not running on http://localhost:3001. Start it first before running tests.');
});
