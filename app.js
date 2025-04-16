import express, { json } from 'express';
import { createConnection } from 'mysql2/promise';
import cors from 'cors';
// Enable CORS for all routes
const app = express();
const port = 3000;
app.use(cors());
app.use(json());

// Tạo kết nối tới cơ sở dữ liệu MySQL
const db = await createConnection({
  host: 'mysql-3d6d342f-huynhkhoi2002123-e6a2.k.aivencloud.com',
  user: 'avnadmin', 
  password: 'AVNS_8pbTDsiPb0wb3sZx_YB', 
  database: 'QuanLyDiem', 
  port: '20053'
});

// Kiểm tra kết nối
db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối tới cơ sở dữ liệu:', err);
    return;
  }
  console.log('Kết nối thành công tới cơ sở dữ liệu MySQL');
});

// Các API để lấy dữ liệu từ cơ sở dữ liệu
app.get('/khoa', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Khoa');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});

app.get('/lop', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Lop');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});

app.get('/monhoc', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM MonHoc');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});

app.get('/sinhvien', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM SinhVien');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});

app.get('/diem', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Diem');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});

// API để thêm sinh viên
app.post('/sinhvien', async (req, res) => {
  let { MaSV, HoTen, GioiTinh, MaLop } = req.body;

  // Đảm bảo MaSV luôn bắt đầu bằng 'DH'
  if (!MaSV.startsWith('DH')) {
    MaSV = 'DH' + MaSV;
  }

  // Tạo Email tự động từ MaSV
  const Email = `${MaSV}@student.stu.edu.vn`;

  const query = 'INSERT INTO SinhVien (MaSV, HoTen, GioiTinh, Email, MaLop) VALUES (?, ?, ?, ?, ?)';
  const values = [MaSV, HoTen, GioiTinh, Email, MaLop];

  try {
    const [result] = await db.query(query, values);
    res.status(201).json({ message: 'Sinh viên đã được thêm thành công', studentId: result.insertId });
  } catch (err) {
    console.error('Lỗi khi thêm sinh viên:', err);
    res.status(500).json({ message: 'Lỗi khi thêm sinh viên', error: err });
  }
});

// API để cập nhật thông tin sinh viên
app.put('/sinhvien/:MaSV', async (req, res) => {
  const { MaSV } = req.params;
  const { HoTen, MaLop, GioiTinh, Email } = req.body;
  const sql = 'UPDATE SinhVien SET HoTen=?, MaLop=?, GioiTinh=?, Email=? WHERE MaSV=?';

  try {
    await db.query(sql, [HoTen, MaLop, GioiTinh, Email, MaSV]);
    res.json({ message: 'Cập nhật sinh viên thành công!' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin sinh viên' });
  }
});

// API để xóa sinh viên
app.delete('/sinhvien/:MaSV', async (req, res) => {
  const MaSV = req.params.MaSV;

  // Bước 1: Xác nhận việc xóa trước
  const confirm = req.query.confirm;

  if (confirm !== 'true') {
    return res.status(400).json({ message: 'Bạn cần xác nhận việc xóa bằng cách thêm ?confirm=true vào URL' });
  }

  // Bước 2: Xóa các bản ghi liên quan trong bảng Diem
  try {
    await db.query('DELETE FROM Diem WHERE MaSV = ?', [MaSV]);

    // Bước 3: Sau khi xóa điểm thành công, xóa sinh viên
    const [result] = await db.query('DELETE FROM SinhVien WHERE MaSV = ?', [MaSV]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên để xóa' });
    }
    res.json({ message: 'Xóa sinh viên thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa sinh viên hoặc điểm' });
  }
});

// API lấy danh sách sinh viên theo mã môn học
app.get('/sinhvien/:maMonHoc', async (req, res) => {
  const { maMonHoc } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT sv.MaSV, sv.HoTen 
       FROM DangKyMonHoc dkmh 
       JOIN SinhVien sv ON dkmh.MaSV = sv.MaSV 
       WHERE dkmh.MaMH = ?`,
      [maMonHoc]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sinh viên:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sinh viên', error: err });
  }
});


// API lấy điểm của sinh viên theo mã sinh viên và mã môn học
app.get('/diem/:maSV/:maMonHoc', async (req, res) => {
  const { maSV, maMonHoc } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM Diem WHERE MaSV = ? AND MaMH = ?',
      [maSV, maMonHoc]
    );
    res.status(200).json(rows[0] || {});
  } catch (err) {
    console.error('Lỗi khi lấy điểm:', err);
    res.status(500).json({ message: 'Lỗi khi lấy điểm', error: err });
  }
});

// API cập nhật điểm cho sinh viên
app.put('/diem/:maSV/:maMonHoc', async (req, res) => {
  const { maSV, maMonHoc } = req.params;
  const { DiemCC, DiemGK, DiemCK } = req.body;

  try {
    // Kiểm tra xem đã có điểm cho sinh viên và môn học này chưa
    const [rows] = await db.execute(
      'SELECT * FROM Diem WHERE MaSV = ? AND MaMH = ?',
      [maSV, maMonHoc]
    );

    if (rows.length > 0) {
      // Nếu đã có điểm => cập nhật
      await db.execute(
        'UPDATE Diem SET DiemCC = ?, DiemGK = ?, DiemCK = ? WHERE MaSV = ? AND MaMH = ?',
        [DiemCC, DiemGK, DiemCK, maSV, maMonHoc]
      );
      res.status(200).json({ message: 'Điểm đã được cập nhật thành công' });
    } else {
      // Nếu chưa có điểm => thêm mới
      await db.execute(
        'INSERT INTO Diem (MaSV, MaMH, DiemCC, DiemGK, DiemCK) VALUES (?, ?, ?, ?, ?)',
        [maSV, maMonHoc, DiemCC, DiemGK, DiemCK]
      );
      res.status(201).json({ message: 'Điểm đã được thêm mới thành công' });
    }
  } catch (err) {
    console.error('Lỗi khi lưu điểm:', err);
    res.status(500).json({ message: 'Lỗi khi lưu điểm', error: err });
  }
});
// Lấy thống kê tổng quan
app.get('/thongke', async (req, res) => {
  try {
    const [sinhVienRows] = await db.execute('SELECT COUNT(*) AS totalStudents FROM SinhVien');
    const [monHocRows] = await db.execute('SELECT COUNT(*) AS totalCourses FROM MonHoc');
    const [diemRows] = await db.execute('SELECT AVG((DiemCC + DiemGK + DiemCK) / 3) AS averageGrade FROM Diem');

    res.json({
      totalStudents: sinhVienRows[0].totalStudents,
      totalCourses: monHocRows[0].totalCourses,
      averageGrade: parseFloat(diemRows[0].averageGrade.toFixed(2)), // làm tròn
    });
  } catch (err) {
    console.error('Lỗi khi lấy thống kê:', err);
    res.status(500).json({ message: 'Lỗi server', error: err });
  }
});


app.get('/dangky', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        dk.MaSV, sv.HoTen, 
        dk.MaMH, mh.TenMH, 
        dk.NgayDangKy 
      FROM DangKyMonHoc dk
      JOIN SinhVien sv ON dk.MaSV = sv.MaSV
      JOIN MonHoc mh ON dk.MaMH = mh.MaMH
      ORDER BY dk.NgayDangKy DESC
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách đăng ký môn học:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});
app.post('/dangky', async (req, res) => {
  const { MaSV, MaMH } = req.body;

  try {
    // Kiểm tra sinh viên và môn học có tồn tại không
    const [svRows] = await db.query('SELECT * FROM SinhVien WHERE MaSV = ?', [MaSV]);
    const [mhRows] = await db.query('SELECT * FROM MonHoc WHERE MaMH = ?', [MaMH]);

    if (svRows.length === 0 || mhRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Không tồn tại sinh viên hoặc môn học' });
    }

    // Kiểm tra đã đăng ký chưa
    const [dkRows] = await db.query('SELECT * FROM DangKyMonHoc WHERE MaSV = ? AND MaMH = ?', [MaSV, MaMH]);
    if (dkRows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Đã đăng ký môn học này' });
    }

    // Kiểm tra số lượng hiện tại
    const [countRows] = await db.query('SELECT COUNT(*) as count FROM DangKyMonHoc WHERE MaMH = ?', [MaMH]);
    const soLuongHienTai = countRows[0].count;
    const soLuongToiDa = mhRows[0].SoLuong;

    if (soLuongHienTai >= soLuongToiDa) {
      return res.status(400).json({ status: 'full', message: 'Môn học đã đầy' });
    }

    // Thêm đăng ký
    const ngayDK = new Date().toISOString().split('T')[0];
    await db.query('INSERT INTO DangKyMonHoc (MaSV, MaMH, NgayDangKy) VALUES (?, ?, ?)', [MaSV, MaMH, ngayDK]);

    return res.status(200).json({ status: 'success', message: 'Đăng ký thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});
app.delete('/dangky', async (req, res) => {
  const { MaSV, MaMH } = req.body;

  // Kiểm tra xem có truyền đủ thông tin hay không
  if (!MaSV || !MaMH) {
    return res.status(400).json({ message: 'Cần truyền đầy đủ Mã sinh viên và Mã môn học' });
  }

  try {
    // Kiểm tra xem sinh viên đã đăng ký môn học chưa
    const [rows] = await db.execute('SELECT * FROM DangKyMonHoc WHERE MaSV = ? AND MaMH = ?', [MaSV, MaMH]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đăng ký môn học của sinh viên' });
    }

    // Thực hiện xóa đăng ký môn học
    const [result] = await db.execute('DELETE FROM DangKyMonHoc WHERE MaSV = ? AND MaMH = ?', [MaSV, MaMH]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Xóa không thành công' });
    }

    return res.status(200).json({ message: 'Đã xóa đăng ký môn học thành công' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Có lỗi xảy ra khi xóa đăng ký môn học' });
  }
});
// Khởi tạo server và lắng nghe tại port 5000
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
