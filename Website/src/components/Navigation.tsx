type NavigationItem = {
  label: string
  icon: string
}

type NavigationProps = {
  activeItem: string
  onNavigate: (item: string) => void
  onLogout: () => void
}

const navigation: { group: string; items: NavigationItem[] }[] = [
  {
    group: 'Yoga & Pilates',
    items: [
      { label: 'Dashboard', icon: '▦' },
      { label: 'Hướng dẫn viên', icon: '❧' },
      { label: 'Gói tập', icon: '◇' },
      { label: 'Check-In', icon: '✓' },
      { label: 'Hội viên', icon: '♙' },
    ],
  },
  {
    group: 'Vận hành trung tâm',
    items: [
      { label: 'Báo cáo thống kê', icon: '◔' },
      { label: 'Hóa đơn', icon: '▧' },
      { label: 'Khuyến mãi', icon: '%' },
      { label: 'Nhân viên', icon: '♟' },
    ],
  },
  {
    group: 'Cửa hàng & kho',
    items: [
      { label: 'Đơn hàng', icon: '▤' },
      { label: 'Sản phẩm', icon: '▣' },
      { label: 'Danh mục', icon: '☷' },
      { label: 'Kho hàng', icon: '□' },
    ],
  },
]

export default function Navigation({
  activeItem,
  onNavigate,
  onLogout,
}: NavigationProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">❧</span>
        <div>
          <b>YOGA & PILATES</b>
          <small>MINDFUL MOVEMENT</small>
        </div>
      </div>
      <nav aria-label="Điều hướng chính">
        {navigation.map(({ group, items }) => (
          <section className="nav-group" key={group}>
            <p>{group}</p>
            {items.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className={`nav-item ${activeItem === label ? 'active' : ''}`}
                aria-current={activeItem === label ? 'page' : undefined}
                onClick={() => onNavigate(label)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </button>
            ))}
          </section>
        ))}
      </nav>
      <button className="logout-button" type="button" onClick={onLogout}>
        <span className="nav-icon">↪</span>
        Đăng xuất
      </button>
      <div className="sidebar-bottom">
        <span className="online-dot" />
        Hệ thống hoạt động tốt
      </div>
    </aside>
  )
}
