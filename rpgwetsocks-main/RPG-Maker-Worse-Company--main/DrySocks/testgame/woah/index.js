const express = require('express');
const app = express();
const port = 8000



app.get('/', (req, res) => {

  res.render('testgame\index.html')

})




app.listen(port)
