const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Thêm bcrypt để mã hóa mật khẩu
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Cổng web mới (không phải cổng API)
const webPort = 4000; 

// Route chính của ứng dụng web
app.get('/', (req, res) => {
  res.send('Welcome to Admin Web');
});

app.listen(webPort, () => {
  console.log(`Web server is running on http://localhost:${webPort}`);
});

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // nếu có mật khẩu thì thêm vào
  database: 'translate'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});

app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Cấu hình Static Folder (Để phục vụ tệp CSS, JS, ảnh)
app.use(express.static('public'));

// Route: LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
      if (err) {
        return res.status(500).send('Lỗi Server');
      }

      if (results.length > 0) {
        const user = results[0];

        // Kiểm tra mật khẩu đã mã hóa bằng bcrypt
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            return res.status(500).send('Lỗi so sánh mật khẩu');
          }

          if (result) {
            res.json({ success: true, message: 'Đăng nhập thành công', user });
          } else {
            res.json({ success: false, message: 'Sai mật khẩu' });
          }
        });
      } else {
        res.json({ success: false, message: 'Tên đăng nhập không tồn tại' });
      }
    });
  } catch (error) {
    res.status(500).send('Lỗi Server');
  }
});

// Route: REGISTER
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Kiểm tra nếu thiếu thông tin
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin' });
  }

  // Kiểm tra xem tên người dùng hoặc email đã tồn tại chưa
  const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(checkUserQuery, [username, email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi Server' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Tên người dùng hoặc email đã tồn tại' });
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu' });
      }

      // Lưu thông tin người dùng vào cơ sở dữ liệu
      const insertQuery = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, hashedPassword, email], (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Lỗi khi lưu người dùng' });
        }

        res.json({ success: true, message: 'Đăng ký thành công' });
      });
    });
  });
});

// Kiểm tra email tồn tại
app.post('/check-email', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
    res.json({ exists: results.length > 0 });
  });
});

// Kiểm tra username tồn tại
app.post('/check-username', (req, res) => {
  const { username } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
    res.json({ exists: results.length > 0 });
  });
});
// Endpoint translate
app.post('/api/translate', async (req, res) => {
  const { q, source, target, user_id } = req.body;

  if (!q || !source || !target || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await axios.post('http://localhost:5000/translate', {
      q,
      source,
      target,
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const translatedText = response.data.translatedText;

    // Ghi vào database với user_id và thời gian hiện tại
    const sql = 'INSERT INTO translations (input_text, source_lang, target_lang, translated_text, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [q, source, target, translatedText, user_id], (err, result) => {
      if (err) {
        console.error('DB Error:', err);
      } else {
        console.log('Saved translation for user ID:', user_id);
      }
    });

    res.json({ translatedText });

  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
});
// Node.js API route
app.get("/api/history/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const sql = `
      SELECT id, input_text, source_lang, target_lang, translated_text, translated_at
      FROM translations
      WHERE user_id = ?
      ORDER BY translated_at DESC
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Lỗi truy vấn CSDL" });
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /api/favorites/:userId
app.get('/api/favorites/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log("Nhận yêu cầu GET favorites với userId =", userId); // log userId

  const sql = 'SELECT * FROM favorites WHERE user_id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy favorites:', err.message);
      console.error('Chi tiết lỗi:', err); // log chi tiết lỗi

      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(200).json([]);
      }

      return res.status(500).json({ error: 'Lỗi khi truy vấn' });
    }

    res.status(200).json(results);
  });
});

app.post('/api/favorites/add', (req, res) => {
  const { user_id, translation_id, input_text, translated_text, source_lang, target_lang } = req.body;

  const sql = `
    INSERT INTO favorites (user_id, translation_id, input_text, translated_text, source_lang, target_lang)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, translation_id, input_text, translated_text, source_lang, target_lang], (err, result) => {
    if (err) {
      console.error('Lỗi khi thêm favorite:', err);
      return res.status(500).json({ error: 'Lỗi khi thêm favorite' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/favorites/remove', (req, res) => {
  const { user_id, translation_id } = req.query;

  const sql = `DELETE FROM favorites WHERE user_id = ? AND translation_id = ?`;

  db.query(sql, [user_id, translation_id], (err, result) => {
    if (err) {
      console.error('Lỗi khi xoá favorite:', err);
      return res.status(500).json({ error: 'Lỗi khi xoá favorite' });
    }
    res.json({ success: true });
  });
});


app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});



//CRUD 
// Route: Hiển thị danh sách người dùng
app.get('/users', (req, res) => {
  const sql = 'SELECT user_id, username, email FROM users';  // Chỉ cần lấy các trường cần thiết
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.render('users', { users: results }); // Truyền dữ liệu vào view
  });
});

// Route: Thêm người dùng
app.post('/add-user', (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);  // Mã hóa mật khẩu trước khi lưu
  const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
  
  db.query(sql, [username, hashedPassword, email], (err, result) => {
    if (err) throw err;
    res.redirect('/users');  // Sau khi thêm người dùng, chuyển hướng về trang danh sách người dùng
  });
});

// Route: Cập nhật thông tin người dùng
app.post('/edit-user/:id', (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  const sql = 'UPDATE users SET username = ?, email = ? WHERE user_id = ?';
  
  db.query(sql, [username, email, id], (err, result) => {
    if (err) throw err;
    res.redirect('/users');  // Sau khi cập nhật, chuyển hướng về trang danh sách người dùng
  });
});


// Route: Xóa người dùng
app.get('/delete-user/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE user_id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.redirect('/users');  // Sau khi xóa, chuyển hướng về trang danh sách người dùng
  });
});

// Route để lấy lịch sử dịch từ của người dùng
app.get('/history/:userId', (req, res) => {
  const userId = req.params.userId;

  // Truy vấn lịch sử dịch với thông tin người dùng (username)
  const sql = `
    SELECT t.id, t.input_text, t.source_lang, t.target_lang, t.translated_text, t.translated_at, u.username 
    FROM translations t
    JOIN users u ON t.user_id = u.user_id
    WHERE t.user_id = ? 
    ORDER BY t.translated_at DESC
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) throw err;
    res.render('history', { history: results });  // Render trang lịch sử
  });
});

