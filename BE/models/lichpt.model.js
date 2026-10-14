const db = require("../common/db");

function lockedError() {
  const error = new Error('Ca da co lich thue, khong the sua hoac xoa');
  error.status = 409;
  error.code = 'SCHEDULE_HAS_BOOKINGS';
  return error;
}

const Lichpt = (lichpt) => {
  this.LichPTID = lichpt.LichPTID;
  this.PTID = lichpt.PTID;
  this.NgayLam = lichpt.NgayLam;
  this.GioBatDau = lichpt.GioBatDau;
  this.GioKetThuc = lichpt.GioKetThuc;
  this.TrangThai = lichpt.TrangThai;
};

Lichpt.getById = (LichPTID, callback) => {
  const sqlString = "SELECT * FROM `lichpt` WHERE `LichPTID` = ?";
  db.query(sqlString, [LichPTID], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Lichpt.getAll = (callback) => {
  const sqlString = "SELECT * FROM `lichpt`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Lichpt.getAvailableByPT = (PTID, from, to, callback) => {
  let sqlString = `
    SELECT
      LichPTID,
      PTID,
      DATE_FORMAT(NgayLam, '%Y-%m-%d') AS NgayLam,
      TIME_FORMAT(GioBatDau, '%H:%i:%s') AS GioBatDau,
      TIME_FORMAT(GioKetThuc, '%H:%i:%s') AS GioKetThuc,
      TrangThai
    FROM lichpt
    WHERE PTID = ?
      AND TrangThai = 'AVAILABLE'
      AND NgayLam >= CURDATE()
      AND TIMESTAMP(NgayLam, GioBatDau) > NOW()
  `;
  const params = [PTID];
  if (from) {
    sqlString += " AND NgayLam >= ?";
    params.push(from);
  }
  if (to) {
    sqlString += " AND NgayLam <= ?";
    params.push(to);
  }
  sqlString += " ORDER BY NgayLam ASC, GioBatDau ASC";
  db.query(sqlString, params, callback);
};

Lichpt.insert = (lichpt, callback) => {
  saveSchedule(lichpt, null).then(result=>callback(null,result),callback);
};

Lichpt.update = (lichpt, LichPTID, callback) => {
  saveSchedule(lichpt,LichPTID).then(result=>callback(null,result),callback);
};

async function saveSchedule(data,id) {
  const c=await db.promise().getConnection();
  try {
    await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await c.beginTransaction();
    await require('./classes.model').lockPT(c,data.PTID);
    if(id) {
      const [rows]=await c.query('SELECT PTID FROM lichpt WHERE LichPTID=? FOR UPDATE',[id]);
      const [booked]=await c.query('SELECT 1 FROM thuept WHERE LichPTID=? LIMIT 1',[id]);
      if(!rows.length || booked.length) throw lockedError();
    }
    if(data.TrangThai!=='OFF') {
      const [classes]=await c.query("SELECT BuoiHocID FROM buoihoc WHERE PTID=? AND TrangThai='PUBLISHED' AND BatDau<TIMESTAMP(?,?) AND KetThuc>TIMESTAMP(?,?) LIMIT 1 FOR UPDATE",[data.PTID,data.NgayLam,data.GioKetThuc,data.NgayLam,data.GioBatDau]);
      const [shifts]=await c.query("SELECT LichPTID FROM lichpt WHERE PTID=? AND TrangThai<>'OFF' AND NgayLam=? AND GioBatDau<? AND GioKetThuc>? AND LichPTID<>? LIMIT 1 FOR UPDATE",[data.PTID,data.NgayLam,data.GioKetThuc,data.GioBatDau,id||0]);
      if(classes.length || shifts.length) throw Object.assign(new Error('Hướng dẫn viên trùng lịch lớp nhóm hoặc lịch 1–1.'),{status:409,code:'SCHEDULE_OVERLAP'});
    }
    const [r]=id ? await c.query('UPDATE lichpt SET ? WHERE LichPTID=?',[data,id]) : await c.query('INSERT INTO lichpt SET ?',data);
    await c.commit();
    return {LichPTID:id||r.insertId,...data};
  } catch(error) {await c.rollback();throw error;} finally {c.release();}
}

Lichpt.delete = (LichPTID, callback) => {
  db.query(`DELETE FROM lichpt WHERE LichPTID = ?
    AND NOT EXISTS (SELECT 1 FROM thuept WHERE thuept.LichPTID = lichpt.LichPTID)`, [LichPTID], (err, res) => {
    if (err) {
      return callback(err);
    }
    if (res.affectedRows !== 1) return callback(lockedError());
    callback(null, { message: "Xóa lichpt thành công" });
  });
};

module.exports = Lichpt;
