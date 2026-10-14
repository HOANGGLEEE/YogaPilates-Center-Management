const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const Classes = require('../models/classes.model');
const { positiveId, resourcePayload, sessionPayload } = require('../services/class-validation');
const staff = requireRole('ADMIN', 'STAFF');
const admin = requireRole('ADMIN');
const customer = requireRole('CUSTOMER');
const handle = (action, status = 200) => async (req, res, next) => {
    try {
        res.status(status).json(await action(req));
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Tên hoặc đăng ký đã tồn tại.' });
        if (error.status)
            return res.status(error.status).json({ message: error.message, code: error.code });
        next(error);
    }
};
router.get('/', handle(req => Classes.list(req.auth.VaiTro !== 'CUSTOMER')));
router.get('/mine', customer, handle(req => Classes.mine(req.auth.TaiKhoanID)));
router.get('/resources', staff, handle(() => Classes.resources()));
for (const kind of ['rooms', 'types']) {
    router.post('/' + kind, admin, handle(req => Classes.saveResource(kind, null, resourcePayload(kind, req.body)), 201));
    router.put('/' + kind + '/:id', admin, handle(req => Classes.saveResource(kind, positiveId(req.params.id), resourcePayload(kind, req.body))));
}
router.post('/', admin, handle(req => Classes.saveSession(null, sessionPayload(req.body), req.auth.TaiKhoanID), 201));
router.put('/:id', admin, handle(req => Classes.saveSession(positiveId(req.params.id), sessionPayload(req.body), req.auth.TaiKhoanID)));
router.post('/:id/cancel', admin, handle(req => Classes.cancelSession(positiveId(req.params.id))));
router.post('/:id/complete', admin, handle(req => Classes.complete(positiveId(req.params.id))));
router.post('/:id/book', customer, handle(req => Classes.book(positiveId(req.params.id), req.auth.TaiKhoanID)));
router.post('/bookings/:id/cancel', customer, handle(req => Classes.cancelBooking(positiveId(req.params.id), req.auth.TaiKhoanID)));
router.get('/:id/roster', staff, handle(req => Classes.roster(positiveId(req.params.id))));
router.post('/:id/attendance', staff, handle(async (req) => {
    const id = positiveId(req.params.id);
    const qr = req.body.code ? await require('../controllers/checkin.controller').resolveCode(req.body.code) : null;
    return Classes.attend(id, qr ? null : positiveId(req.body.DangKyLopID), req.auth.TaiKhoanID, qr);
}));
module.exports = router;
