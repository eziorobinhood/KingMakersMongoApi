const express   = require('express');
const authRouter = require('./router/auth');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');


const app = express();
app.use(express.json());
app.use(authRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const PORT = 3000;
const mongoURI = "mongodb+srv://rrkrish123_db_user:admin@kingmakerscluster.5t6zmad.mongodb.net/?appName=kingmakerscluster";


mongoose.connect(mongoURI).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});