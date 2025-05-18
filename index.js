const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const cors = require("cors")
const bcrypt = require("bcrypt") // Thêm bcrypt để mã hóa mật khẩu
const axios = require("axios")
const path = require("path") // Thêm path để xử lý đường dẫn file

const app = express()
const port = 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Cấu hình Static Folder (Để phục vụ tệp CSS, JS, ảnh)
app.use(express.static(path.join(__dirname, "public")))

// Cổng web mới (không phải cổng API)
const webPort = 4000

// Route chính của ứng dụng web
app.get("/", (req, res) => {
  res.send("Welcome to Admin Web")
})

app.listen(webPort, () => {
  console.log(`Web server is running on http://localhost:${webPort}`)
})

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // nếu có mật khẩu thì thêm vào
  database: "translate",
})

db.connect(err => {
  if (err) {
    console.error('Failed to connect to MySQL database:', err.message);
    process.exit(1);
  }
  console.log('Successfully connected to MySQL database');
});

// Utility function to check if a password is hashed
const isHashed = (password) => {
  return password.length === 60 && password.startsWith('$2b$');
};

app.set("view engine", "ejs")

// Route: LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error('Error in POST /login:', err.message);
        return res.status(500).send('Lỗi Server');
      }

      if (results.length > 0) {
        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            console.error('Error comparing password in POST /login:', err.message);
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
    console.error('Error in POST /login:', error.message);
    res.status(500).send('Lỗi Server');
  }
});

// Route: REGISTER
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin' });
  }

  const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(checkUserQuery, [username, email], (err, results) => {
    if (err) {
      console.error('Error in POST /register:', err.message);
      return res.status(500).json({ success: false, message: 'Lỗi Server' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Tên người dùng hoặc email đã tồn tại' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password in POST /register:', err.message);
        return res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu' });
      }

      const insertQuery = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, hashedPassword, email], (err, result) => {
        if (err) {
          console.error('Error saving user in POST /register:', err.message);
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
      console.error('Error in POST /check-email:', err.message);
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
      console.error('Error in POST /check-username:', err.message);
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

    const sql = 'INSERT INTO translations (input_text, source_lang, target_lang, translated_text, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [q, source, target, translatedText, user_id], (err, result) => {
      if (err) {
        console.error('DB Error in POST /api/translate:', err.message);
      } else {
        console.log('Saved translation for user ID:', user_id);
      }
    });

    res.json({ translatedText });
  } catch (error) {
    console.error('Error in POST /api/translate:', error.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Node.js API route
app.get('/api/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT id, input_text, source_lang, target_lang, translated_text, translated_at
    FROM translations
    WHERE user_id = ?
    ORDER BY translated_at DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error in GET /api/history/:userId:', err.message);
      return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    }
    res.json(results);
  });
});

// GET /api/favorites/:userId
app.get('/api/favorites/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log('Nhận yêu cầu GET favorites với userId =', userId);

  const sql = 'SELECT * FROM favorites WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy favorites:', err.message);
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
      console.error('Lỗi khi thêm favorite:', err.message);
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
      console.error('Lỗi khi xoá favorite:', err.message);
      return res.status(500).json({ error: 'Lỗi khi xoá favorite' });
    }
    res.json({ success: true });
  });
});

// Route: GET /users/:id
app.get('/users/:id', (req, res) => {
  const query = 'SELECT user_id AS id, username, email FROM users WHERE user_id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error in GET /users/:id:', err.message);
      return res.status(500).json({ message: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  });
});

// Route: PUT /users/:id/email
app.put('/users/:id/email', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  const checkEmailQuery = 'SELECT user_id FROM users WHERE email = ? AND user_id != ?';
  db.query(checkEmailQuery, [email, req.params.id], (err, existing) => {
    if (err) {
      console.error('Error in PUT /users/:id/email (check email):', err.message);
      return res.status(500).json({ message: err.message });
    }

    console.log(`Checking if email ${email} exists for other users: ${existing.length} found`);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const updateQuery = 'UPDATE users SET email = ? WHERE user_id = ?';
    db.query(updateQuery, [email, req.params.id], (err, result) => {
      if (err) {
        console.error('Error in PUT /users/:id/email (update):', err.message);
        return res.status(500).json({ message: err.message });
      }
      res.status(200).send();
    });
  });
});

// Route: PUT /users/:id/password
app.put('/users/:id/password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const query = 'SELECT password FROM users WHERE user_id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error in PUT /users/:id/password (select):', err.message);
      return res.status(500).json({ message: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let storedPassword = results[0].password;
    console.log(`Stored password for user ${req.params.id}: ${storedPassword}`);

    // Check if stored password is hashed, if not, hash it for comparison
    if (!isHashed(storedPassword)) {
      console.log('Password is not hashed, hashing it now for comparison');
      bcrypt.hash(storedPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password in PUT /users/:id/password:', err.message);
          return res.status(500).json({ message: err.message });
        }

        const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
        db.query(updateQuery, [hashedPassword, req.params.id], (err, result) => {
          if (err) {
            console.error('Error updating hashed password in PUT /users/:id/password:', err.message);
            return res.status(500).json({ message: err.message });
          }

          // After updating the password, proceed with comparison
          compareAndUpdatePassword(hashedPassword);
        });
      });
    } else {
      compareAndUpdatePassword(storedPassword);
    }

    function compareAndUpdatePassword(passwordToCompare) {
      bcrypt.compare(oldPassword, passwordToCompare, (err, isMatch) => {
        if (err) {
          console.error('Error comparing password in PUT /users/:id/password:', err.message);
          return res.status(500).json({ message: err.message });
        }

        if (!isMatch) {
          console.log(`Old password does not match for user ${req.params.id}`);
          return res.status(400).json({ message: 'Incorrect old password' });
        }

        bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
          if (err) {
            console.error('Error hashing new password in PUT /users/:id/password:', err.message);
            return res.status(500).json({ message: err.message });
          }

          const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
          db.query(updateQuery, [hashedNewPassword, req.params.id], (err, result) => {
            if (err) {
              console.error('Error updating new password in PUT /users/:id/password:', err.message);
              return res.status(500).json({ message: err.message });
            }
            res.status(200).send();
          });
        });
      });
    }
  });
});

// Route: GET /users/check-email/:email
app.get('/users/check-email/:email', (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  console.log(`Checking email: ${email}`);
  const query = 'SELECT user_id FROM users WHERE LOWER(email) = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err.message);
      return res.status(500).json({ message: err.message });
    }
    console.log(`Rows found for email ${email}: ${results.length}`);
    res.json({ exists: results.length > 0 });
  });
});


// Route: PUT /users/:id/username
app.put('/users/:id/username', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long' });
  }

  // Check if username already exists for another user
  const checkUsernameQuery = 'SELECT user_id FROM users WHERE username = ? AND user_id != ?';
  db.query(checkUsernameQuery, [username, req.params.id], (err, existing) => {
    if (err) {
      console.error('Error in PUT /users/:id/username (check username):', err.message);
      return res.status(500).json({ message: err.message });
    }

    console.log(`Checking if username ${username} exists for other users: ${existing.length} found`);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Update username
    const updateQuery = 'UPDATE users SET username = ? WHERE user_id = ?';
    db.query(updateQuery, [username, req.params.id], (err, result) => {
      if (err) {
        console.error('Error in PUT /users/:id/username (update):', err.message);
        return res.status(500).json({ message: err.message });
      }
      
      console.log(`Username updated for user ${req.params.id} to ${username}`);
      res.status(200).send();
    });
  });
});

// Route: GET /users/check-username/:username
app.get('/users/check-username/:username', (req, res) => {
  const username = req.params.username.trim();
  console.log(`Checking username: ${username}`);
  
  const query = 'SELECT user_id FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error checking username:', err.message);
      return res.status(500).json({ message: err.message });
    }
    
    console.log(`Rows found for username ${username}: ${results.length}`);
    res.json({ exists: results.length > 0 });
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

//CRUD
// Route: Hiển thị danh sách người dùng
app.get("/users", (req, res) => {
  const sql = "SELECT user_id, username, email FROM users" // Chỉ cần lấy các trường cần thiết
  db.query(sql, (err, results) => {
    if (err) throw err
    res.render("users", { users: results }) // Truyền dữ liệu vào view
  })
})

// Route: Thêm người dùng
app.post("/add-user", (req, res) => {
  const { username, password, email } = req.body
  const hashedPassword = bcrypt.hashSync(password, 10) // Mã hóa mật khẩu trước khi lưu
  const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)"

  db.query(sql, [username, hashedPassword, email], (err, result) => {
    if (err) throw err
    res.redirect("/users") // Sau khi thêm người dùng, chuyển hướng về trang danh sách người dùng
  })
})

// Route: Cập nhật thông tin người dùng
app.post("/edit-user/:id", (req, res) => {
  const { id } = req.params
  const { username, email } = req.body
  const sql = "UPDATE users SET username = ?, email = ? WHERE user_id = ?"

  db.query(sql, [username, email, id], (err, result) => {
    if (err) throw err
    res.redirect("/users") // Sau khi cập nhật, chuyển hướng về trang danh sách người dùng
  })
})

// Route: Xóa người dùng
app.get("/delete-user/:id", (req, res) => {
  const { id } = req.params
  const sql = "DELETE FROM users WHERE user_id = ?"

  db.query(sql, [id], (err, result) => {
    if (err) throw err
    res.redirect("/users") // Sau khi xóa, chuyển hướng về trang danh sách người dùng
  })
})

// Route để lấy lịch sử dịch từ của người dùng
app.get("/history/:userId", (req, res) => {
  const userId = req.params.userId

  // Truy vấn lịch sử dịch với thông tin người dùng (username)
  const sql = `
    SELECT t.id, t.input_text, t.source_lang, t.target_lang, t.translated_text, t.translated_at, u.username 
    FROM translations t
    JOIN users u ON t.user_id = u.user_id
    WHERE t.user_id = ? 
    ORDER BY t.translated_at DESC
  `

  db.query(sql, [userId], (err, results) => {
    if (err) throw err
    res.render("history", { history: results }) // Render trang lịch sử
  })
})

// Route để lấy thống kê số lượng dịch theo ngày
app.get("/stats", (req, res) => {
  const sql = `
    SELECT DATE(translated_at) AS date, COUNT(*) AS translations_count
    FROM translations
    GROUP BY DATE(translated_at)
    ORDER BY DATE(translated_at) DESC
  `

  db.query(sql, (err, results) => {
    if (err) throw err
    res.json(results) // Trả về dữ liệu cho frontend
  })
})

// Route để hiển thị biểu đồ thống kê dịch
app.get("/chart", (req, res) => {
  res.render("chart") // Render trang chart.ejs
})
