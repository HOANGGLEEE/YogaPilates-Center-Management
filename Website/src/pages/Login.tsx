import { useState, type FormEvent } from 'react'
import { login, type AdminSession } from '../services/auth'

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {name}
    </span>
  )
}
export default function Login({
  onLogin,
}: {
  onLogin: (session: AdminSession) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [remember, setRemember] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setError('')
    setPending(true)
    try {
      onLogin(await login(email.trim(), password, remember))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại.')
    } finally {
      setPending(false)
    }
  }
  return (
    <main className="admin-login">
      <aside className="admin-promo">
        <header className="admin-brand-row">
          <div className="admin-brand">
            <span className="brand-mark">
              <Icon name="self_improvement" />
            </span>
            <div>
              <strong>
                YOGA & PILATES <small>STUDIO MANAGEMENT</small>
              </strong>
              <span>YOGA & PILATES CENTER</span>
            </div>
          </div>
          <span className="admin-node">
            <i /> KHÔNG GIAN QUẢN TRỊ
          </span>
        </header>
        <div className="admin-intro">
          <span className="admin-badge">
            <Icon name="verified_user" /> QUẢN LÝ TRUNG TÂM
          </span>
          <h1>
            CHĂM SÓC HỘI VIÊN. <em>KẾT NỐI CHUYỂN ĐỘNG.</em>{' '}
            VẬN HÀNH <em>THẢNH THƠI.</em>
          </h1>
          <p>
            Quản lý hội viên, gói Yoga & Pilates, lịch hướng dẫn cá nhân,
            check-in và thanh toán trong cùng một không gian.
            Dành thêm thời gian cho trải nghiệm của từng hội viên.
          </p>
        </div>
        <footer className="admin-trust">
          <span>
            <Icon name="lock" />
            Hồ sơ hội viên
          </span>
          <span>
            <Icon name="key" />
            QR check-in
          </span>
          <span>
            <Icon name="fact_check" />
            Theo dõi thanh toán
          </span>
        </footer>
      </aside>
      <section className="admin-access">
        <form onSubmit={submit} aria-busy={pending}>
          <span className="admin-badge">
            <i /> DÀNH CHO ĐỘI NGŨ TRUNG TÂM
          </span>
          <h2>Đăng nhập Quản trị Viên</h2>
          <p className="admin-description">
            Vui lòng sử dụng tài khoản quản trị được cấp để truy cập trung tâm
            điều hành.
          </p>
          <div className="admin-divider">
            <span>ĐĂNG NHẬP BẰNG EMAIL</span>
          </div>
          <label htmlFor="admin-email">Email Quản trị</label>
          <div className="admin-field">
            <Icon name="badge" />
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className="admin-password-label">
            <label htmlFor="admin-password">Mật khẩu truy cập hệ thống</label>
            <span className="admin-support-note">
              Liên hệ quản trị viên để được hỗ trợ
            </span>
          </div>
          <div className="admin-field">
            <Icon name="lock" />
            <input
              id="admin-password"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              required
              maxLength={1024}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={visible}
            >
              <Icon name={visible ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
          <label className="admin-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={pending}
            />
            Ghi nhớ đăng nhập trong 12 giờ
          </label>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button className="admin-submit" type="submit" disabled={pending}>
            {pending ? 'ĐANG XÁC THỰC…' : 'ĐĂNG NHẬP QUẢN TRỊ'}
            <Icon name="arrow_forward" />
          </button>
          <div className="admin-security">
            <Icon name="warning" />
            <p>
              <b>Cảnh báo An ninh:</b> Khu vực chỉ dành cho quản trị viên được
              cấp quyền. Không chia sẻ thông tin đăng nhập và luôn đăng xuất khi
              sử dụng thiết bị dùng chung.
            </p>
          </div>
          <footer className="admin-support">
            <span>
              Hỗ trợ: liên hệ quản trị viên của trung tâm
            </span>
            <span>
              <i /> Yoga & Pilates
            </span>
          </footer>
        </form>
      </section>
    </main>
  )
}
