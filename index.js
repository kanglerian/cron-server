const express = require('express');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const db = new sqlite3.Database('cron.db', (err) => {
  if(err){
    console.log('Gagal membuka database: ', err.message);
  } else {
    console.log('Berhasil terhubung dengan database.');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    hour INTEGER,
    minute INTEGER,
    status BOOLEAN DEFAULT FALSE
  )`, (err) => {
    if(err){
      console.log('Gagal tabel, ', err.message);
    } else {
      console.log('Berhasil tabel!');
    }
  });

const hitung = (angka, message) => {
  for (var i = 0; i < angka; i++) {
    setTimeout(() => {
      console.log(`${i}: ${message}`);
    }, i * 1000);
  }
}

const setupCron = async () => {
  db.all('SELECT * FROM messages', [], (err, rows) => {
    if(err){
      console.log('Gagal mengambil data.');
    } else {
      rows.forEach((time, i) => {
        if(!time.status){
          cron.schedule(`${time.minute} ${time.hour} 11 1 *`, () => {
            hitung(100 + time.minute, time.message);
            db.run(`UPDATE messages SET status = TRUE WHERE id = ?`, [time.id], (err) => {
              if(err){
                console.log(err.message);
              }else{
                console.log('Berhasil mengupdate data');
              }
            });
          });
        }
      });
    }
  });
}

setupCron();

app.get('/', async (req, res) => {
  db.all(`SELECT * FROM messages`, [], (err, rows) => {
    if(err){
      res.send(err.message)
    } else {
      return res.json(rows);
    };
  });
});

app.post('/content', async(req, res) => {
  db.run(`INSERT INTO messages (message, hour, minute) VALUES (?,?,?)`, [req.body.message, req.body.hour, req.body.minute], (err) => {
    if(err){
      console.log('Gagal menyimpan data.');
    }else{
      console.log('Berhasil menyimpan data.');
      setupCron();
    }
  });
  return res.send('sip');
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
