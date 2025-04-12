const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Enable CORS for all routes
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// Tạo kết nối tới cơ sở dữ liệu MySQL
const db = mysql.createConnection({
  
});

// Kiểm tra kết nối
db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối tới cơ sở dữ liệu:', err);
    return;
  }
  console.log('Kết nối thành công tới cơ sở dữ liệu MySQL');
});


//GetAllData
app.get('/khoa', (req, res) => {
    const query = 'SELECT * FROM Khoa';  
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
        }
        res.json(results);
    });
});
app.get('/lop', (req, res) => {
    const query = 'SELECT * FROM Lop';  
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
        }
        res.json(results);
    });
});
app.get('/monhoc', (req, res) => {
    const query = 'SELECT * FROM MonHoc'; 
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
        }
        res.json(results);
    });
});
app.get('/sinhvien', (req, res) => {
    const query = 'SELECT * FROM SinhVien'; 
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
        }
        res.json(results);
    });
});
app.get('/diem', (req, res) => {
    const query = 'SELECT * FROM Diem'; 
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
        }
        res.json(results);
    });
});
//Add SinVien
app.post('/sinhvien', (req, res) => {
    const { MaSV, HoTen, GioiTinh, NgaySinh, Email, SoDT, MaLop } = req.body;
  
    // SQL query để thêm sinh viên vào bảng SinhVien
    const query = 'INSERT INTO SinhVien (MaSV, HoTen, GioiTinh, NgaySinh, Email, SoDT, MaLop) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [MaSV, HoTen, GioiTinh, NgaySinh, Email, SoDT, MaLop];
  
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Lỗi khi thêm sinh viên:', err);
        return res.status(500).json({ message: 'Lỗi khi thêm sinh viên', error: err });
      }
      res.status(201).json({ message: 'Sinh viên đã được thêm thành công', studentId: result.insertId });
    });
  });
  app.put('/sinhvien/:MaSV', (req, res) => {
    const { MaSV } = req.params;
    const { HoTen, MaLop, GioiTinh, Email, SoDT } = req.body;
    const sql = 'UPDATE SinhVien SET HoTen=?, MaLop=?, GioiTinh=?, Email=?, SoDT=? WHERE MaSV=?';
    db.query(sql, [HoTen, MaLop, GioiTinh, Email, SoDT, MaSV], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Cập nhật sinh viên thành công!' });
    });
  });
  app.delete('/sinhvien/:MaSV', (req, res) => {
    const MaSV = req.params.MaSV;
    const query = 'DELETE FROM SinhVien WHERE MaSV = ?';
    db.query(query, [MaSV], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi xóa sinh viên' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên để xóa' });
        }
        res.json({ message: 'Xóa sinh viên thành công' });
    });
});
app.put('/diem/:MaSV', (req, res) => {
  const { MaSV } = req.params;
  const { MaMH, DiemCC, DiemGK, DiemCK, DiemTong } = req.body;
  
  const sql = `
    UPDATE Diem
    SET DiemCC = ?, DiemGK = ?, DiemCK = ?, DiemTong = ?
    WHERE MaSV = ? AND MaMH = ?
  `;
  
  db.query(sql, [DiemCC, DiemGK, DiemCK, DiemTong, MaSV, MaMH], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ Cập nhật điểm thành công!' });
  });
});

app.delete('/monhoc/:id', (req, res) => {
  const { id } = req.params;  // Lấy MaMH từ tham số URL

  const query = 'DELETE FROM MonHoc WHERE MaMH = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Lỗi khi xóa môn học:', err);
      return res.status(500).json({ message: 'Lỗi khi xóa môn học', error: err });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học để xóa' });
    }

    res.status(200).json({ message: 'Môn học đã được xóa thành công' });
  });
});

app.post('/monhoc', (req, res) => {
  const { MaMH, TenMH, SoTinChi, HeSoCC, HeSoGK, HeSoCK } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!MaMH || !TenMH || !SoTinChi || !HeSoCC || !HeSoGK || !HeSoCK) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin môn học' });
  }

  // SQL query để thêm môn học vào bảng MonHoc
  const query = 'INSERT INTO MonHoc (MaMH, TenMH, SoTinChi, HeSoCC, HeSoGK, HeSoCK) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [MaMH, TenMH, SoTinChi, HeSoCC, HeSoGK, HeSoCK];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Lỗi khi thêm môn học:', err);
      return res.status(500).json({ message: 'Lỗi khi thêm môn học', error: err });
    }
    res.status(201).json({ message: 'Môn học đã được thêm thành công', monHocId: result.insertId });
  });
});
// Lắng nghe yêu cầu trên cổng 3000
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
