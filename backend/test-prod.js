fetch('https://uniexo.in/_/backend/api/v1/health')
  .then(res => res.text().then(text => console.log('STATUS:', res.status, 'BODY:', text)))
  .catch(err => console.error('ERROR:', err));
