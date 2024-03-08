var express = require('express'),
	path = require('path'),
	app = express()

// Express middleware for serving static files
//

app.use(express.static(path.join(__dirname, './')));
app.get('/', function(req, res) {
	res.redirect('./')
});
app.listen(8082)

