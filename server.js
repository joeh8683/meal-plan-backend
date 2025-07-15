// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

console.log("✅ API KEY loaded:", process.env.OPENROUTER_API_KEY ? "Yes" : "No");

const app = express();
app.use(cors());
app.use(express.json());


app.post('/generate-meal-plan', async (req, res) => {
  console.log("Received body:", req.body);
  const { currentWeight, goalWeight, age, height, gender, activity } = req.body;
    if (!currentWeight || !goalWeight) {
    return res.status(400).json({ error: "Missing input" });
  }

  const prompt = `
You are a nutritionist. Create a detailed 4-week meal plan for someone who is:
- Current weight: ${currentWeight}kg
- Goal weight: ${goalWeight}kg
- Age: ${age || 'not specified'}
- Height: ${height || 'not specified'} cm
- Gender: ${gender || 'not specified'}
- Activity level: ${activity || 'not specified'}

Include breakfast, lunch, dinner, and snacks for each day, with calories.
`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "gryphe/mythomist-7b:free", // Free model
      messages: [
        { role: "system", content: "You are a helpful AI nutritionist." },
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ plan: response.data.choices[0].message.content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
