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
  const { currentWeight, goalWeight, age, height, gender, activity, restrictions } = req.body;
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
- Dietary Restrictions: ${restrictions || 'not specified'}

Include breakfast, lunch, dinner, and snacks for each day, with calories.
Then, write a short summary of the plan.
Format it like:
### Week 1
...
### Week 2
...
### Week 3
...
### Week 4
...
### Summary
`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "deepseek/deepseek-chat-v3-0324:free", // Free model
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

app.post("/summarise-meals", async (req, res) => {
  const { fullMealPlan } = req.body;

  if (!fullMealPlan) {
    return res.status(400).json({ error: "No meal plan provided" });
  }

  const prompt = `Here is a meal plan:\n\n${fullMealPlan}\n\nPlease list only the meals mentioned (e.g., "chickpea salad", "grilled chicken and vegetables", etc.) in a clean, comma-separated format without any extra commentary.`;

  try {
const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
  model: "openai/gpt-3.5-turbo",
  messages: [
    { role: "system", content: "You are a helpful assistant that extracts clean meal names from meal plans." },
    { role: "user", content: prompt }
  ]
}, {
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  }
});

const aiMessage = response.data.choices?.[0]?.message?.content?.trim();


    if (!aiMessage) {
      return res.status(500).json({ error: "No response from AI." });
    }

    res.json({ mealList: aiMessage });
  } catch (err) {
    console.error("Error summarising meals:", err);
    res.status(500).json({ error: "Failed to summarise meals" });
  }
});


app.listen(3000, () => console.log('Server running on http://localhost:3000'));




