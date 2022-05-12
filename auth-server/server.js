// Initialize packages
let express = require('express')
let request = require('request')
let querystring = require('querystring')
let cors = require('cors')
let app = express()

// Initialize client id, client sec, and redirect
let redirect_uri_login = 'http://localhost:8888/callback'
let client_id = '1414c0ccf9c44a1bbb2bd99dd1f3aa43'
let client_secret = '34015e979791444ba1d01dace7016081'

app.use(cors())

// Login endpoints to redirect to spotify method passing in ID, sec, and redirect
app.get('/login', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: 'user-read-private user-read-email user-library-read',
        redirect_uri: redirect_uri_login
      }))
})

// Create callback endpoint for spotify to send auth code to.
// Use the authorization code to make a request to the token endpoint passing in the code and clients
// secret and when the response comes back, get an access token. Redirect back to our react application
app.get('/callback', function(req, res) {
    let code = req.query.code || null
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri_login,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(
            client_id + ':' + client_secret
        ).toString('base64'))
      },
      json: true
    }
    request.post(authOptions, function(error, response, body) {
      var access_token = body.access_token
      let uri = process.env.FRONTEND_URI || 'http://localhost:3000/playlist'

      res.redirect(uri + '?access_token=' + access_token)
    })
})

// Generate for Apple Music

const jwt = require('jsonwebtoken');
const fs = require('fs');

const private_key = fs.readFileSync('apple_private_key.p8').toString();
const team_id = '9GL6728H6Y';
const key_id = '7UGVUZPYN7';

// Use JSON web token to generate key for client. Client uses token to acces AM API
const token = jwt.sign({}, private_key, {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: team_id,
    header: {
      alg: 'ES256',
      kid: key_id
    }
});

// Endpoint that client uses to access token
const token_key = '8d2c0dfa-c783-11ec-9d64-0242ac120002'
app.get('/token', function (req, res) {
  if(req.query.key === token_key){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({token: token}));
  }
});

// Initialize port, ask server nicely to listen to port
let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
app.listen(port)