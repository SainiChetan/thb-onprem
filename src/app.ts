import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as router from './routes';
import cookieParser = require('cookie-parser'); // this module doesn't use the ES6 default export yet

const app: express.Express = express();

app.use(bodyParser.json({
    limit: '500mb'
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieParser());

app.use('/', router);
// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

  app.use((error: any, req, res, next) => {
    res.status(error['status'] || 500);
    // 'error'
    res.send({
      message: error.message,
      error
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((error: any, req, res, next) => {
  res.status(error['status'] || 500);
  // 'error'
  res.send({
    message: error.message,
    error: {}
  });
  return null;
});




export default app;