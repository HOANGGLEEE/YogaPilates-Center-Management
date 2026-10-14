-- Chi doc: chay tren database ma backend su dung truoc migration 005.
SELECT DATABASE() AS DatabaseHienTai, VERSION() AS MySQLVersion,
       @@lower_case_table_names AS LowerCaseTableNames,
       @@session.time_zone AS SessionTimeZone, NOW() AS DatabaseTime;

SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND LOWER(TABLE_NAME) IN (
    'taikhoan','hoivien','pt','lichpt','thuept','dangkygoitap',
    'thanhtoan','quyenloigoitap','phongtap','loailop','buoihoc','dangkylop','diemdanhlop'
  ) ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND LOWER(TABLE_NAME) IN ('taikhoan','hoivien','pt','dangkygoitap')
  AND COLUMN_NAME IN ('TaiKhoanID','HoiVienID','PTID','DangKyID')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Doi chieu ten bang tham chieu trong 005 voi ten that neu MySQL phan biet hoa/thuong.
-- Cac ID duoc tham chieu phai la INT signed, cac bang phai dung InnoDB.
-- Neu co bat ky bang lop hoc nao da ton tai: dung lai va doi chieu schema.
