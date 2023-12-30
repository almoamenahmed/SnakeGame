const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'ahmed',
  password: 'randompassword1',
  database: 'snakeGame'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected as ID ' + db.threadId);
});

module.exports = db;
