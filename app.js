const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const POST = 5001;

app.use(cors());
app.use(bodyParser.json());

app.post('/translate', async (req, res) => {
    const { q, source, target } = req.body;
    try {
        const response = await axios.post('http://localhost:5000/translate', {
          q,
          source,
          target,
          format: "text"
        }, {
            headers:{
                'Content-Type': 'application/json'
            }
        });
        res.json({translateText: response.data.translatedText});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error during translation' });
    }
});
app.listen(POST,()=>{
    console.log(`Server running on port ${POST}`);});