const express = require('express');
const apiKey = require('../middlewares/apiKey');
const validation = require('../middlewares/validation');
const webhookController = require('../controllers/webhook');

module.exports = (sockContainer) => {
    const router = express.Router();

    router.post('/webhook/text', apiKey, validation, async (req, res) => {
        await webhookController.sendTextWebhook(sockContainer, req.body, res);
    });

    router.post('/webhook/image', apiKey, validation, async (req, res) => {
        await webhookController.sendImageWebhook(sockContainer, req.body, res);
    });

    router.post('/webhook/audio', apiKey, validation, async (req, res) => {
        await webhookController.sendAudioWebhook(sockContainer, req.body, res);
    });

    router.post('/webhook/video', apiKey, validation, async (req, res) => {
        await webhookController.sendVideoWebhook(sockContainer, req.body, res);
    });

    router.post('/webhook/location', apiKey, validation, async (req, res) => {
        await webhookController.sendLocationWebhook(sockContainer, req.body, res);
    });

    return router;
};
