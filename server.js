const express = require('express');
const fs = require('fs');
const CONFIG = require('./config/config');
const cors = require('./middlewares/cors');
const { startSocket } = require('./src/socket');
const Route = require('./routes/web');

const app = express();
const port = CONFIG.PORT || 3000;

app.use(express.json());
app.use(cors());

const sockContainer = { sock: null };

(async () => {
    try {
        await startSocket(sockContainer);

        app.use('/', Route(sockContainer));

        app.listen(port, () => {
            console.log(`[SERVER] Server is running on PORT: ${port}`);
        });
    } catch (error) {
        console.error('[SERVER] Failed to start socket:', error);
    }
})();