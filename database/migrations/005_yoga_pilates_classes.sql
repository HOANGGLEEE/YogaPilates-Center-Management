-- Yoga & Pilates: schema cho lop nhom, MySQL >= 8.0.16, InnoDB.
-- Chon dung database truoc khi chay; KHONG tao/doi/xoa database o day.
-- Chay 005_yoga_pilates_classes_preflight.sql va xem ket qua truoc.
-- Chi chay mot lan. Neu bang da ton tai, doi chieu schema, KHONG chay lai.
-- DDL MySQL tu commit: backup truoc; khong dung ROLLBACK de hoan tac DDL.
-- Chi them bang moi, khong sua hoi vien, goi tap, thanh toan hay lich PT.

CREATE TABLE phongtap (
    PhongTapID INT AUTO_INCREMENT PRIMARY KEY,
    TenPhong VARCHAR(100) NOT NULL,
    SucChua INT NOT NULL,
    MoTa VARCHAR(500) NULL,
    TrangThai ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY UQ_PhongTap_TenPhong (TenPhong),
    CONSTRAINT CK_PhongTap_SucChua CHECK (SucChua > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE loailop (
    LoaiLopID INT AUTO_INCREMENT PRIMARY KEY,
    TenLoai VARCHAR(100) NOT NULL,
    LoaiHinh ENUM('YOGA', 'PILATES') NOT NULL,
    MoTa VARCHAR(500) NULL,
    -- Tuong thich ma quyen loi hien co: YOGA / GROUP_X (Pilates nhom).
    MaQuyenLoi VARCHAR(50) NOT NULL,
    TrangThai ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY UQ_LoaiLop_TenLoai (TenLoai),
    CONSTRAINT CK_LoaiLop_QuyenLoi CHECK (
        (LoaiHinh = 'YOGA' AND MaQuyenLoi = 'YOGA') OR
        (LoaiHinh = 'PILATES' AND MaQuyenLoi = 'GROUP_X')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buoihoc (
    BuoiHocID INT AUTO_INCREMENT PRIMARY KEY,
    LoaiLopID INT NOT NULL,
    PhongTapID INT NOT NULL,
    PTID INT NOT NULL,
    TenBuoi VARCHAR(150) NOT NULL,
    BatDau DATETIME NOT NULL,
    KetThuc DATETIME NOT NULL,
    SucChua INT NOT NULL,
    GhiChu VARCHAR(500) NULL,
    TrangThai ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')
        NOT NULL DEFAULT 'DRAFT',
    TaoBoi INT NOT NULL,
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CapNhatLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY IX_BuoiHoc_Phong_Lich (PhongTapID, TrangThai, BatDau, KetThuc),
    KEY IX_BuoiHoc_PT_Lich (PTID, TrangThai, BatDau, KetThuc),
    KEY IX_BuoiHoc_Lich (TrangThai, BatDau, BuoiHocID),
    CONSTRAINT FK_BuoiHoc_LoaiLop FOREIGN KEY (LoaiLopID)
        REFERENCES loailop(LoaiLopID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_BuoiHoc_PhongTap FOREIGN KEY (PhongTapID)
        REFERENCES phongtap(PhongTapID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_BuoiHoc_PT FOREIGN KEY (PTID)
        REFERENCES PT(PTID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_BuoiHoc_TaoBoi FOREIGN KEY (TaoBoi)
        REFERENCES TaiKhoan(TaiKhoanID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT CK_BuoiHoc_ThoiGian CHECK (KetThuc > BatDau),
    CONSTRAINT CK_BuoiHoc_SucChua CHECK (SucChua > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dangkylop (
    DangKyLopID INT AUTO_INCREMENT PRIMARY KEY,
    BuoiHocID INT NOT NULL,
    HoiVienID INT NOT NULL,
    -- Luu goi thuc te du dieu kien khi dang ky, khong tao goi/thu tien tu UI.
    DangKyID INT NOT NULL,
    TrangThai ENUM('BOOKED', 'CANCELLED') NOT NULL DEFAULT 'BOOKED',
    DangKyLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    HuyLuc DATETIME NULL,
    CapNhatLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY UQ_DangKyLop_Buoi_HoiVien (BuoiHocID, HoiVienID),
    KEY IX_DangKyLop_Buoi_TrangThai (BuoiHocID, TrangThai),
    KEY IX_DangKyLop_HoiVien_TrangThai (HoiVienID, TrangThai, BuoiHocID),
    CONSTRAINT FK_DangKyLop_BuoiHoc FOREIGN KEY (BuoiHocID)
        REFERENCES buoihoc(BuoiHocID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_DangKyLop_HoiVien FOREIGN KEY (HoiVienID)
        REFERENCES HoiVien(HoiVienID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_DangKyLop_Goi FOREIGN KEY (DangKyID)
        REFERENCES DangKyGoiTap(DangKyID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT CK_DangKyLop_Huy CHECK (
        (TrangThai = 'BOOKED' AND HuyLuc IS NULL) OR
        (TrangThai = 'CANCELLED' AND HuyLuc IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE diemdanhlop (
    DiemDanhLopID INT AUTO_INCREMENT PRIMARY KEY,
    DangKyLopID INT NOT NULL,
    DiemDanhLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DiemDanhBoi INT NOT NULL,
    Nguon ENUM('MANUAL', 'QR') NOT NULL,
    UNIQUE KEY UQ_DiemDanhLop_DangKy (DangKyLopID),
    CONSTRAINT FK_DiemDanhLop_DangKy FOREIGN KEY (DangKyLopID)
        REFERENCES dangkylop(DangKyLopID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_DiemDanhLop_Nguoi FOREIGN KEY (DiemDanhBoi)
        REFERENCES TaiKhoan(TaiKhoanID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kiem tra sau khi chay: phai co 5 bang moi, chua co du lieu mau.
SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND LOWER(TABLE_NAME) IN ('phongtap','loailop','buoihoc','dangkylop','diemdanhlop')
ORDER BY TABLE_NAME;
SELECT 'phongtap' AS Bang, COUNT(*) AS SoDong FROM phongtap
UNION ALL SELECT 'loailop', COUNT(*) FROM loailop
UNION ALL SELECT 'buoihoc', COUNT(*) FROM buoihoc
UNION ALL SELECT 'dangkylop', COUNT(*) FROM dangkylop
UNION ALL SELECT 'diemdanhlop', COUNT(*) FROM diemdanhlop;
