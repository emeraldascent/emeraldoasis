const http = require('http');
http.get('http://localhost:5173/', res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data.slice(0, 500));
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
