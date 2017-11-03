const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const request = require('request');
const { parse } = require('node-html-parser');
const http = require('http');
const hostname = '127.0.0.1';
const port = 65500;
const fs = require('fs');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  const server = http.createServer((req, res) => {
    console.log(req.url);
    if (req.url === '/') {
      fs.readFile('./notification.html', function(err, html) {
        if (err) {
          throw err;
        }
        res.writeHeader(200, { 'Content-Type': 'text/html' });
        res.write(html);
        res.end();
      });
    } else if (req.url === '/lite') {
      fs.readFile('./lite.mini.html', function(err, html) {
        if (err) {
          throw err;
        }
        res.writeHeader(200, { 'Content-Type': 'text/html' });
        res.write(html);
        res.end();
      });
    } else if (req.url.endsWith('lite')) {
      let t = req.url.replace('/lite', '');
      request.get('https://stackoverflow.com/questions/tagged' + t, function(
        error,
        response,
        body
      ) {
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body);
        let root = parse(body);
        let arr = [];
        //console.log(root.querySelector('.tags'));
        root.querySelectorAll('.question-hyperlink').forEach(function(element) {
          let href =
            'https://stackoverflow.com' +
            element.rawAttrs
              .replace('href="', '')
              .replace('" class="question-hyperlink"', '');
          arr.push({ title: element.childNodes[0].rawText, link: href });
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(JSON.stringify(arr[0]));
      });
    } else {
      request.get(
        'https://stackoverflow.com/questions/tagged' + req.url,
        function(error, response, body) {
          //console.log('error:', error); // Print the error if one occurred
          //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          //console.log('body:', body);
          let root = parse(body);
          let arr = [];
          //console.log(root.querySelector('.tags'));
          root
            .querySelectorAll('.question-hyperlink')
            .forEach(function(element) {
              let href =
                'https://stackoverflow.com' +
                element.rawAttrs
                  .replace('href="', '')
                  .replace('" class="question-hyperlink"', '');
              arr.push({ title: element.childNodes[0].rawText, link: href });
            });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end(JSON.stringify({ items: arr }));
        }
      );
    }
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}
