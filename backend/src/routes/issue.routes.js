const express = require('express');
const router = express.Router();
const {
  getIssues,
  createIssue,
  getIssue,
  updateIssue,
  moveIssue,
  addComment,
  addAttachment,
  deleteIssue,
} = require('../controllers/issue.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect, tenantMiddleware);

router.route('/')
  .get(getIssues)
  .post(createIssue);

router.route('/:id')
  .get(getIssue)
  .put(updateIssue)
  .delete(deleteIssue);

router.post('/:id/move', moveIssue);
router.post('/:id/comments', addComment);
router.post('/:id/attachments', upload.single('file'), addAttachment);

module.exports = router;

