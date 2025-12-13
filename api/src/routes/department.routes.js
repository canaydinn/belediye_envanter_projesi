// api/src/routes/department.routes.js
const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ
router.get('/', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), departmentsController.getAll);
router.get('/:id', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), departmentsController.getById);

// WRITE (admin)
router.post('/', authorize(ROLES.MUNICIPALITY_ADMIN), departmentsController.create);
router.put('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), departmentsController.update);
router.delete('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), departmentsController.remove);

module.exports = router;
