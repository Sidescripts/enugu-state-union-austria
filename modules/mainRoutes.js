const express = require("express");
const AdminAuthController = require("./admin/authController");
const {PasswordResetController, updatePassword} = require("./admin/resetPasswordContorller");
const {AuthMid} = require("../middlewares/adminAuth");
const eventController = require("./admin/eventController");
const  {getContentStats} = require("./admin/dashboard");
const executiveController = require("./admin/execuController");
const announcementController = require("./admin/announController");
const createEventValidation = require("../middlewares/validations/createEventsVal");
const {createAnnouncementValidation, updateImageValidations, updateStatusValidations} = require("../middlewares/validations/createAnnouVal");
const {createExecutiveValidation,updateImageValidation, updateStatusValidation} = require("../middlewares/validations/createExecVal");
const {
    handleUploadError, 
    uploadImage,
    uploadMixedMedia,
    uploadMultipleImages
} = require("../middlewares/uploadMiddleware");
const router = express.Router();

// DASHBOARD
router.get('/admin/stats', AuthMid, getContentStats);

// AUTH
router.post("/admin/signup", AdminAuthController().register);
router.post("/admin/login", AdminAuthController().login);
router.post("/change-password", AuthMid, updatePassword);
router.post("/forget-password", PasswordResetController().requestReset);
router.post("/reset-password", PasswordResetController().resetPassword);

// EVENTS
router.post('/e/create-events',AuthMid, handleUploadError,uploadMixedMedia,createEventValidation, handleUploadError,eventController.createEvent);
router.get('/e/all-events', AuthMid, eventController.getAllEvents);
router.patch('/e/update/:id', AuthMid, handleUploadError,uploadMixedMedia,eventController.updateEvent);
router.patch('/e/update-status/:id', AuthMid, eventController.updateEventStatus);
router.delete('/e/delete/:id', AuthMid, eventController.deleteEvent);
router.get('/e/:id', AuthMid, eventController.getEventById);
router.get('/e/recent/events', AuthMid, eventController.getUpcomingEvents);
router.get('/e/past/events', AuthMid, eventController.getPastEvents);
router.patch('/e/:id/add-media', AuthMid, eventController.addMediaToEvent);
router.patch('/e/:id/remove-media', AuthMid, eventController.removeMediaFromEvent);

// EXEC
router.post('/ex/create', AuthMid,   uploadImage, handleUploadError, executiveController.createExecutive);
router.get('/ex/all', AuthMid, executiveController.getAllExecutives);
router.get('/ex/:id', AuthMid, executiveController.getExecutiveById);
router.patch('/ex/update/:id', AuthMid, uploadImage, handleUploadError,executiveController.updateExecutive);
router.patch('/ex/update-image/:id', AuthMid, updateImageValidation, executiveController.updateExecutiveImage);
router.patch('/ex/remove-image/:id', AuthMid, executiveController.removeExecutiveImage);
router.patch('/ex/update-status/:id', AuthMid, updateStatusValidation, executiveController.updateExecutiveStatus);
router.delete('/ex/delete/:id', AuthMid, executiveController.deleteExecutive);

// ANOUN
router.post('/a/create', AuthMid, uploadMultipleImages,handleUploadError,announcementController.createAnnouncement);
router.get('/a/all', AuthMid, announcementController.getAllAnnouncements);
router.get('/a/:id', AuthMid, announcementController.getAnnouncementById);
router.patch('/a/update/:id', AuthMid, uploadMultipleImages,handleUploadError, announcementController.updateAnnouncement);
router.patch('/update-status/:id', AuthMid, updateStatusValidations, announcementController.updateAnnouncementStatus);
router.patch('/a/toggle-importance/:id', AuthMid, announcementController.toggleAnnouncementImportance);
router.delete('/a/delete/:id',AuthMid, announcementController.deleteAnnouncement);


// USER - events
router.get('/user/events', eventController.getAllEvents);
router.get('/user/events/:id', eventController.getEventById);

// USER - announcements
router.get('/u/active/announcements', announcementController.getActiveAnnouncements);
router.get('/u/important/announcement', announcementController.getImportantActiveAnnouncements);
router.get('/user/:id', announcementController.getAnnouncementById);

// USER - exec
router.get('/u/board', executiveController.getActiveBoard);
router.get('/user/:id', executiveController.getExecutiveById);

module.exports = router;